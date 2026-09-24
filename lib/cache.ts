import "server-only";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

// Müşteri menüsü `branch:{id}` etiketiyle önbelleğe alınır (MIMARI §8, Faz 1.10).
export const branchTag = (branchId: string) => `branch:${branchId}`;

/** Menüyü etkileyen her değişiklikten sonra çağrılır; bir sonraki istek güncel veriyi alır. */
export function expireBranchMenu(branchId: string) {
  revalidateTag(branchTag(branchId), { expire: 0 });
}

/** İşletme düzeyindeki değişiklikler (ad, logo, durum, abonelik) tüm şubeleri etkiler. */
export async function expireBusinessMenus(businessId: string) {
  const branches = await db.branch.findMany({
    where: { businessId },
    select: { id: true },
  });
  branches.forEach((branch) => expireBranchMenu(branch.id));
}
