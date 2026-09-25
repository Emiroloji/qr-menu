"use server";

import { refresh } from "next/cache";
import { type ActionResult, ActionError, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  getSheetReference,
  MAX_EXCEL_SIZE,
  readMenuWorkbook,
} from "@/lib/menu-excel";
import { type ImportError, parseSheetRows } from "@/lib/menu-sheet";
import { assertBranchBelongsToBusiness } from "@/lib/ownership";
import { hasPermission, requirePermission } from "@/lib/permissions";
import { assertPlanLimit } from "@/lib/plan-limits";
import { requireWritableSession } from "@/lib/session";
import { id } from "@/lib/validations/common";

// Excel'den ürün içe aktarma (Faz 3.3). Önce önizleme, sonra aynı dosyayla uygulama.
// Aynı kategoride aynı adlı ürün güncellenir, yoksa eklenir; hiçbir ürün silinmez.

export type ImportSummary = {
  created: number;
  updated: number;
  newCategories: string[];
  errors: ImportError[];
};

const key = (value: string) => value.trim().toLocaleLowerCase("tr-TR");

async function prepare(formData: FormData) {
  const { user, businessId } = await requireWritableSession();
  await requirePermission(user, "PRODUCT_EDIT");
  const branchId = id.parse(formData.get("branchId"));
  await assertBranchBelongsToBusiness(branchId, businessId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    throw new ActionError("Excel dosyası seçin.");
  if (file.size > MAX_EXCEL_SIZE)
    throw new ActionError("Dosya en fazla 900 KB olabilir.");
  const read = await readMenuWorkbook(await file.arrayBuffer());
  if (!read.ok) throw new ActionError(read.error);

  const reference = await getSheetReference();
  const { items, errors } = parseSheetRows(read.rows, reference);
  if (items.length === 0 && errors.length === 0)
    throw new ActionError("Dosyada ürün satırı yok.");

  const categories = await db.category.findMany({
    where: { branchId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      products: {
        where: { deletedAt: null },
        select: { id: true, name: true },
      },
    },
  });
  const categoryByName = new Map(categories.map((c) => [key(c.name), c]));
  const existing = new Map(
    categories.flatMap((c) =>
      c.products.map((p) => [`${key(c.name)}|${key(p.name)}`, p.id] as const),
    ),
  );

  const newCategories = [
    ...new Map(
      items
        .filter((i) => !categoryByName.has(key(i.category)))
        .map((i) => [key(i.category), i.category]),
    ).values(),
  ];
  const updated = items.filter((i) =>
    existing.has(`${key(i.category)}|${key(i.name)}`),
  ).length;
  const summary: ImportSummary = {
    created: items.length - updated,
    updated,
    newCategories,
    errors: errors.slice(0, 50),
  };

  if (newCategories.length && !hasPermission(user, "CATEGORY_EDIT"))
    throw new ActionError(
      `Dosyada olmayan kategoriler var (${newCategories.join(", ")}). Kategori ekleme yetkiniz yok; önce bu kategorileri ekletin.`,
    );
  if (summary.created > 0)
    await assertPlanLimit(businessId, "products", { adding: summary.created });

  return {
    branchId,
    items,
    summary,
    reference,
    categoryByName,
    existing,
    lastSortOrder: categories.length,
  };
}

export async function previewMenuImport(
  formData: FormData,
): Promise<ActionResult<ImportSummary>> {
  try {
    return { ok: true, data: (await prepare(formData)).summary };
  } catch (error) {
    return toActionError(error);
  }
}

export async function importMenu(
  formData: FormData,
): Promise<ActionResult<ImportSummary>> {
  try {
    const plan = await prepare(formData);
    const { branchId, items, summary, existing } = plan;
    if (summary.errors.length)
      return {
        ok: false,
        error: "Dosyada hatalı satırlar var. Düzeltip yeniden yükleyin.",
      };

    const [allergens, tags] = await Promise.all([
      db.allergen.findMany({ select: { id: true, code: true } }),
      db.tag.findMany({ select: { id: true, code: true } }),
    ]);
    const allergenId = new Map(allergens.map((a) => [a.code, a.id]));
    const tagId = new Map(tags.map((t) => [t.code, t.id]));

    await db.$transaction(
      async (tx) => {
        const categoryIds = new Map(
          [...plan.categoryByName].map(([k, c]) => [k, c.id]),
        );
        let categorySort = plan.lastSortOrder;
        for (const name of summary.newCategories) {
          const category = await tx.category.create({
            data: { branchId, name, sortOrder: categorySort++ },
          });
          categoryIds.set(key(name), category.id);
        }

        const nextSort = new Map<string, number>();
        for (const item of items) {
          const categoryId = categoryIds.get(key(item.category))!;
          const relations = {
            variants: {
              create: item.variants.map((v, sortOrder) => ({
                ...v,
                sortOrder,
              })),
            },
            allergens: {
              create: item.allergens.map((a) => ({
                allergenId: allergenId.get(a.code)!,
                level: a.level,
              })),
            },
            tags: {
              create: item.tagCodes.map((code) => ({
                tagId: tagId.get(code)!,
              })),
            },
          };
          const scalars = {
            name: item.name,
            description: item.description,
            ingredients: item.ingredients,
            portion: item.portion,
            prepTime: item.prepTime,
            origin: item.origin,
            spiceLevel: item.spiceLevel,
            badges: item.badges,
            isVisible: item.isVisible,
            isAvailable: item.isAvailable,
          };

          const productId = existing.get(
            `${key(item.category)}|${key(item.name)}`,
          );
          if (productId) {
            // Görseller, çeviriler ve besin değerleri korunur. Aynı adlı boyun
            // çevirisi (ör. Küçük → Small) yeni boya taşınır.
            const oldVariants = await tx.productVariant.findMany({
              where: { productId },
              select: { name: true, translations: true },
            });
            const variantTranslations = new Map(
              oldVariants.map((v) => [key(v.name ?? ""), v.translations]),
            );
            await tx.productVariant.deleteMany({ where: { productId } });
            await tx.productAllergen.deleteMany({ where: { productId } });
            await tx.productTag.deleteMany({ where: { productId } });
            await tx.product.update({
              where: { id: productId },
              data: {
                ...scalars,
                ...relations,
                variants: {
                  create: item.variants.map((v, sortOrder) => ({
                    ...v,
                    sortOrder,
                    translations:
                      variantTranslations.get(key(v.name ?? "")) ?? {},
                  })),
                },
              },
            });
            continue;
          }
          if (!nextSort.has(categoryId)) {
            const last = await tx.product.aggregate({
              where: { categoryId, deletedAt: null },
              _max: { sortOrder: true },
            });
            nextSort.set(categoryId, (last._max.sortOrder ?? -1) + 1);
          }
          const sortOrder = nextSort.get(categoryId)!;
          nextSort.set(categoryId, sortOrder + 1);
          await tx.product.create({
            data: { ...scalars, categoryId, sortOrder, ...relations },
          });
        }
      },
      { timeout: 60_000 },
    );

    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: summary };
  } catch (error) {
    return toActionError(error);
  }
}
