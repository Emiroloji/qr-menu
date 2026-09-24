"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  assertBranchBelongsToBusiness,
  assertCategoryBelongsToBusiness,
} from "@/lib/ownership";
import { assertOwner, requirePermission } from "@/lib/permissions";
import { countUsage, getActivePlan, isWithinLimit } from "@/lib/plan-limits";
import { productImageFiles, PRODUCT_IMAGE_SIZES } from "@/lib/product-image";
import { applyPriceChange } from "@/lib/pricing";
import { requireWritableSession } from "@/lib/session";
import { copyFile, publicUrl } from "@/lib/storage";
import { firstError } from "@/lib/validations/common";
import { bulkPriceSchema, copyMenuSchema } from "@/lib/validations/menu";

/** Şubedeki (veya bir kategorideki) tüm fiyatlara zam / indirim. */
export async function bulkUpdatePrices(
  _prev: FormState<{ count: number }>,
  formData: FormData,
): Promise<FormState<{ count: number }>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT_PRICE");
    const parsed = bulkPriceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { branchId, categoryId, ...change } = parsed.data;

    await assertBranchBelongsToBusiness(branchId, businessId);
    if (categoryId !== "ALL")
      await assertCategoryBelongsToBusiness(categoryId, businessId);

    const variants = await db.productVariant.findMany({
      where: {
        product: {
          deletedAt: null,
          category: {
            branchId,
            deletedAt: null,
            ...(categoryId !== "ALL" && { id: categoryId }),
          },
        },
      },
      select: { id: true, price: true },
    });
    if (variants.length === 0)
      return { ok: false, error: "Güncellenecek ürün yok." };

    const updates = variants.map((v) => ({
      id: v.id,
      price: applyPriceChange(v.price, change),
    }));
    if (updates.some((u) => u.price <= 0)) {
      return {
        ok: false,
        error: "Bu değişiklikle bazı fiyatlar sıfır veya altına düşüyor.",
      };
    }

    await db.$transaction(
      updates.map((u) =>
        db.productVariant.update({
          where: { id: u.id },
          data: { price: u.price },
        }),
      ),
    );
    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: { count: updates.length } };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Bir şubenin menüsünü (kategoriler, ürünler, boylar, alerjenler, etiketler, besin değerleri,
 * görseller) başka bir şubeye kopyalar. Görsel dosyaları da kopyalanır; böylece bir şubeden
 * silinen ürün diğerinin görselini etkilemez.
 */
export async function copyMenu(
  _prev: FormState<{ count: number }>,
  formData: FormData,
): Promise<FormState<{ count: number }>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = copyMenuSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { fromBranchId, toBranchId, replace } = parsed.data;
    await assertBranchBelongsToBusiness(fromBranchId, businessId);
    await assertBranchBelongsToBusiness(toBranchId, businessId);

    const [source, targetCategories] = await Promise.all([
      db.category.findMany({
        where: { branchId: fromBranchId, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: {
              variants: true,
              allergens: true,
              tags: true,
              nutrition: true,
              images: true,
            },
          },
        },
      }),
      db.category.findMany({
        where: { branchId: toBranchId, deletedAt: null },
        include: {
          _count: { select: { products: { where: { deletedAt: null } } } },
        },
      }),
    ]);
    if (source.length === 0)
      return { ok: false, error: "Kopyalanacak şubede menü yok." };
    if (targetCategories.length > 0 && !replace) {
      return {
        ok: false,
        error:
          "Hedef şubede zaten menü var. Değiştirmek için “mevcut menüyü sil” seçeneğini işaretleyin.",
      };
    }

    // Paket limiti: kopyadan sonraki toplam ürün sayısı.
    const plan = await getActivePlan(businessId);
    const copied = source.reduce((n, c) => n + c.products.length, 0);
    const removed = replace
      ? targetCategories.reduce((n, c) => n + c._count.products, 0)
      : 0;
    const next = (await countUsage(businessId, "products")) - removed + copied;
    if (!plan || !isWithinLimit(plan.maxProducts, next)) {
      return {
        ok: false,
        error: "Kopyalama paketinizin ürün limitini aşıyor.",
      };
    }

    // Görsel dosyaları yeni anahtarlara kopyalanır (DB işleminden önce).
    const imageUrls = new Map<string, string>();
    for (const image of source.flatMap((c) =>
      c.products.flatMap((p) => p.images),
    )) {
      const base = `business/${businessId}/products/copy/${randomUUID()}`;
      await Promise.all(
        PRODUCT_IMAGE_SIZES.map((size, i) =>
          copyFile(productImageFiles(image.url)[i], `${base}-${size}.webp`),
        ),
      );
      imageUrls.set(image.id, publicUrl(base));
    }

    await db.$transaction(async (tx) => {
      if (replace) {
        await tx.category.updateMany({
          where: { branchId: toBranchId, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      }
      for (const category of source) {
        await tx.category.create({
          data: {
            branchId: toBranchId,
            name: category.name,
            description: category.description,
            sortOrder: category.sortOrder,
            isVisible: category.isVisible,
            availableFrom: category.availableFrom,
            availableTo: category.availableTo,
            translations: category.translations ?? {},
            products: {
              create: category.products.map((p) => ({
                name: p.name,
                description: p.description,
                ingredients: p.ingredients,
                portion: p.portion,
                spiceLevel: p.spiceLevel,
                prepTime: p.prepTime,
                origin: p.origin,
                isAvailable: p.isAvailable,
                isVisible: p.isVisible,
                badges: p.badges,
                sortOrder: p.sortOrder,
                translations: p.translations ?? {},
                variants: {
                  create: p.variants.map((v) => ({
                    name: v.name,
                    price: v.price,
                    sortOrder: v.sortOrder,
                    translations: v.translations ?? {},
                  })),
                },
                allergens: {
                  create: p.allergens.map((a) => ({
                    allergenId: a.allergenId,
                    level: a.level,
                  })),
                },
                tags: { create: p.tags.map((t) => ({ tagId: t.tagId })) },
                images: {
                  create: p.images.map((image) => ({
                    url: imageUrls.get(image.id)!,
                    blurDataUrl: image.blurDataUrl,
                    sortOrder: image.sortOrder,
                  })),
                },
                ...(p.nutrition && {
                  nutrition: {
                    create: {
                      calories: p.nutrition.calories,
                      protein: p.nutrition.protein,
                      carbs: p.nutrition.carbs,
                      fat: p.nutrition.fat,
                      sugar: p.nutrition.sugar,
                      salt: p.nutrition.salt,
                    },
                  },
                }),
              })),
            },
          },
        });
      }
    });

    expireBranchMenu(toBranchId);
    refresh();
    return { ok: true, data: { count: copied } };
  } catch (error) {
    return toActionError(error);
  }
}
