import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
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

class NotFoundResult extends Error {}

/**
 * `unstable_cache` gibi, ama `null` sonucu saklamaz. Adresle aranan kayıtlar (menü adresi,
 * özel alan adı) için: botların denediği her uydurma adres önbellekte (bellek ve disk) yeni
 * bir "bulunamadı" kaydı açıyordu ve bunlar hiç temizlenmiyordu. Bulunamayan adres her
 * seferinde veritabanına sorulur (dizinli, hızlı bir sorgu); bulunanlar eskisi gibi saklanır.
 */
export function cacheFound<A extends unknown[], R>(
  fn: (...args: A) => Promise<R | null>,
  keyParts: string[],
  options: { tags: string[]; revalidate: number },
) {
  const cached = unstable_cache(
    async (...args: A) => {
      const result = await fn(...args);
      // unstable_cache hata veren çağrıyı saklamaz.
      if (result === null) throw new NotFoundResult();
      return result;
    },
    keyParts,
    options,
  );
  return async (...args: A): Promise<R | null> => {
    try {
      return await cached(...args);
    } catch (error) {
      if (error instanceof NotFoundResult) return null;
      throw error;
    }
  };
}
