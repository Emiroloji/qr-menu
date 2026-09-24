import "server-only";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";

// Müşteri menüsü `branch:{id}` etiketiyle önbelleğe alınır (MIMARI §8, Faz 1.10).
export const branchTag = (branchId: string) => `branch:${branchId}`;
/** Menü adresinden (işletme/şube slug'ı) şubeyi bulan sorguların etiketi. */
export const MENU_LOOKUP_TAG = "menu-lookup";

/** Şube eklendiğinde, adresi değiştiğinde veya silindiğinde çağrılır. */
export function expireMenuLookup() {
  revalidateTag(MENU_LOOKUP_TAG, { expire: 0 });
}

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
  // İşletmenin durumu, aboneliği ve dilleri adres sorgusunda da tutulur.
  expireMenuLookup();
}
