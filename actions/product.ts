"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  assertCategoryBelongsToBusiness,
  assertProductBelongsToBusiness,
} from "@/lib/ownership";
import { requirePermission } from "@/lib/permissions";
import { assertPlanLimit } from "@/lib/plan-limits";
import { productImageFiles } from "@/lib/product-image";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles } from "@/lib/storage";
import { firstError, id } from "@/lib/validations/common";
import {
  type ProductInput,
  productSchema,
  readProductForm,
  reorderSchema,
} from "@/lib/validations/menu";

/** Ürünün alt kayıtları: boylar, alerjenler, etiketler, besin değeri. */
function relations(data: ProductInput) {
  const nutrition = Object.values(data.nutrition).some((v) => v !== null)
    ? data.nutrition
    : null;
  return {
    variants: data.variants.map((v, sortOrder) => ({
      name: v.name,
      price: v.price,
      sortOrder,
    })),
    allergens: data.allergens,
    tags: data.tagIds.map((tagId) => ({ tagId })),
    nutrition,
  };
}

export async function saveProduct(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  try {
    // 1–2. Oturum ve yetki
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");

    // 3. Girdi
    const productId = id.optional().parse(formData.get("id") || undefined);
    const parsed = productSchema.safeParse(readProductForm(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const data = parsed.data;

    // Alerjen ve etiketler sabit listeden gelmeli.
    const [allergenCount, tagCount] = await Promise.all([
      db.allergen.count({
        where: { id: { in: data.allergens.map((a) => a.allergenId) } },
      }),
      db.tag.count({ where: { id: { in: data.tagIds } } }),
    ]);
    if (
      allergenCount !== data.allergens.length ||
      tagCount !== data.tagIds.length
    ) {
      return { ok: false, error: "Geçersiz alerjen veya etiket seçimi." };
    }

    // 4. Sahiplik  5. Paket limiti
    const category = await assertCategoryBelongsToBusiness(
      data.categoryId,
      businessId,
    );
    if (productId) {
      const product = await assertProductBelongsToBusiness(
        productId,
        businessId,
      );
      if (product.branchId !== category.branchId) {
        return {
          ok: false,
          error: "Ürün başka bir şubenin kategorisine taşınamaz.",
        };
      }
    } else {
      await assertPlanLimit(businessId, "products");
    }

    // 6. İşlem
    const { variants, allergens, tags, nutrition } = relations(data);
    const scalars = {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      ingredients: data.ingredients,
      portion: data.portion,
      origin: data.origin,
      prepTime: data.prepTime,
      spiceLevel: data.spiceLevel,
      isVisible: data.isVisible,
      isAvailable: data.isAvailable,
      badges: data.badges,
    };

    const saved = await db.$transaction(async (tx) => {
      if (productId) {
        const current = await tx.product.findUniqueOrThrow({
          where: { id: productId },
        });
        // Kategori değiştiyse yeni kategorinin sonuna eklenir.
        const sortOrder =
          current.categoryId === data.categoryId
            ? current.sortOrder
            : ((
                await tx.product.aggregate({
                  where: { categoryId: data.categoryId, deletedAt: null },
                  _max: { sortOrder: true },
                })
              )._max.sortOrder ?? -1) + 1;
        await tx.productVariant.deleteMany({ where: { productId } });
        await tx.productAllergen.deleteMany({ where: { productId } });
        await tx.productTag.deleteMany({ where: { productId } });
        await tx.nutrition.deleteMany({ where: { productId } });
        return tx.product.update({
          where: { id: productId },
          data: {
            ...scalars,
            sortOrder,
            variants: { create: variants },
            allergens: { create: allergens },
            tags: { create: tags },
            ...(nutrition && { nutrition: { create: nutrition } }),
          },
        });
      }
      const last = await tx.product.aggregate({
        where: { categoryId: data.categoryId, deletedAt: null },
        _max: { sortOrder: true },
      });
      return tx.product.create({
        data: {
          ...scalars,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
          variants: { create: variants },
          allergens: { create: allergens },
          tags: { create: tags },
          ...(nutrition && { nutrition: { create: nutrition } }),
        },
      });
    });

    // 7. Önbellek
    expireBranchMenu(category.branchId);
    refresh();
    return { ok: true, data: { id: saved.id } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Tek tıkla "tükendi" / "mevcut". */
export async function setProductAvailability(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_TOGGLE_AVAILABILITY");
    const parsed = z
      .object({ productId: id, isAvailable: z.boolean() })
      .safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const product = await assertProductBelongsToBusiness(
      parsed.data.productId,
      businessId,
    );

    await db.product.update({
      where: { id: product.id },
      data: { isAvailable: parsed.data.isAvailable },
    });
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setProductVisibility(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");
    const parsed = z
      .object({ productId: id, isVisible: z.boolean() })
      .safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const product = await assertProductBelongsToBusiness(
      parsed.data.productId,
      businessId,
    );

    await db.product.update({
      where: { id: product.id },
      data: { isVisible: parsed.data.isVisible },
    });
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Yumuşak silme; görseller depodan silinir (MIMARI §9). */
export async function deleteProduct(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");
    const parsed = z.object({ productId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const product = await assertProductBelongsToBusiness(
      parsed.data.productId,
      businessId,
    );

    const images = await db.productImage.findMany({
      where: { productId: product.id },
    });
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: product.id } }),
      db.product.update({
        where: { id: product.id },
        data: { deletedAt: new Date() },
      }),
    ]);
    await deleteFiles(images.flatMap((image) => productImageFiles(image.url)));
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** `parentId`: kategori. `ids`: ürünlerin yeni sırası. */
export async function reorderProducts(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { parentId: categoryId, ids } = parsed.data;
    const category = await assertCategoryBelongsToBusiness(
      categoryId,
      businessId,
    );

    const owned = await db.product.count({
      where: { id: { in: ids }, categoryId, deletedAt: null },
    });
    if (owned !== ids.length) return { ok: false, error: "Ürün bulunamadı." };

    await db.$transaction(
      ids.map((productId, sortOrder) =>
        db.product.update({ where: { id: productId }, data: { sortOrder } }),
      ),
    );
    expireBranchMenu(category.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** `parentId`: ürün. `ids`: görsellerin yeni sırası; ilk görsel kapaktır. */
export async function reorderProductImages(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { parentId: productId, ids } = parsed.data;
    const product = await assertProductBelongsToBusiness(productId, businessId);

    const owned = await db.productImage.count({
      where: { id: { in: ids }, productId },
    });
    if (owned !== ids.length) return { ok: false, error: "Görsel bulunamadı." };

    await db.$transaction(
      ids.map((imageId, sortOrder) =>
        db.productImage.update({ where: { id: imageId }, data: { sortOrder } }),
      ),
    );
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProductImage(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "PRODUCT_EDIT");
    const parsed = z.object({ imageId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    const image = await db.productImage.findUnique({
      where: { id: parsed.data.imageId },
    });
    if (!image) return { ok: false, error: "Görsel bulunamadı." };
    const product = await assertProductBelongsToBusiness(
      image.productId,
      businessId,
    );

    await db.productImage.delete({ where: { id: image.id } });
    await deleteFiles(productImageFiles(image.url));
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
