import "server-only";
import { db } from "@/lib/db";

/** Ürün formunun seçenekleri: şubenin kategorileri, 14 alerjen ve diyet etiketleri. */
export async function getProductFormOptions(branchId: string) {
  const [categories, allergens, tags] = await Promise.all([
    db.category.findMany({
      where: { branchId, deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.allergen.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.tag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { categories, allergens, tags };
}
