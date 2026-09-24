import "server-only";
import { ActionError } from "@/lib/action";
import { db } from "@/lib/db";

// Kaydın oturumdaki işletmeye ait olduğunu doğrular (KURALLAR 5, adım 4).
// İşletme izolasyonu sistemin en kritik güvenlik kuralıdır (MIMARI §5).

export async function assertBranchBelongsToBusiness(
  branchId: string,
  businessId: string,
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, businessId, deletedAt: null },
    select: { id: true },
  });
  if (!branch) throw new ActionError("Şube bulunamadı.");
}

export async function assertCategoryBelongsToBusiness(
  categoryId: string,
  businessId: string,
) {
  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
      branch: { businessId, deletedAt: null },
    },
    select: { id: true, branchId: true },
  });
  if (!category) throw new ActionError("Kategori bulunamadı.");
  return category;
}

export async function assertProductBelongsToBusiness(
  productId: string,
  businessId: string,
) {
  const product = await db.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      category: { deletedAt: null, branch: { businessId, deletedAt: null } },
    },
    select: {
      id: true,
      categoryId: true,
      category: { select: { branchId: true } },
    },
  });
  if (!product) throw new ActionError("Ürün bulunamadı.");
  return {
    id: product.id,
    categoryId: product.categoryId,
    branchId: product.category.branchId,
  };
}

/** Çalışan bu işletmenin çalışanı olmalı; sahip veya başka işletmenin kullanıcısı değil. */
export async function assertStaffBelongsToBusiness(
  userId: string,
  businessId: string,
) {
  const staff = await db.user.findFirst({
    where: { id: userId, businessId, role: "STAFF" },
    select: { id: true, email: true },
  });
  if (!staff) throw new ActionError("Çalışan bulunamadı.");
  return staff;
}
