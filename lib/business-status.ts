import type { SubscriptionStatus } from "@/lib/generated/prisma/enums";

export type BusinessStatus =
  "ACTIVE" | "EXPIRING" | "EXPIRED" | "SUSPENDED" | "PASSIVE";

type SubscriptionLike = {
  status: SubscriptionStatus;
  startsAt: Date;
  endsAt: Date;
};

/** Abonelik bitişine bu kadar gün kala uyarı gösterilir (MIMARI §7). */
export const EXPIRY_WARNING_DAYS = 7;
const DAY = 24 * 60 * 60 * 1000;

export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  ACTIVE: "Aktif",
  EXPIRING: "Süresi yaklaşıyor",
  EXPIRED: "Süresi dolmuş",
  SUSPENDED: "Askıda",
  PASSIVE: "Pasif",
};

/** Şu an geçerli (tarih aralığında, sona erdirilmemiş) abonelik. */
export function getCurrentSubscription<T extends SubscriptionLike>(
  subscriptions: T[],
  now = new Date(),
) {
  return (
    subscriptions
      .filter(
        (s) => s.status !== "EXPIRED" && s.startsAt <= now && s.endsAt > now,
      )
      .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0] ?? null
  );
}

export function getBusinessStatus(
  business: { isActive: boolean; subscriptions: SubscriptionLike[] },
  now = new Date(),
): BusinessStatus {
  if (!business.isActive) return "PASSIVE";
  const current = getCurrentSubscription(business.subscriptions, now);
  if (!current) return "EXPIRED";
  if (current.status === "SUSPENDED") return "SUSPENDED";
  if (current.endsAt.getTime() - now.getTime() <= EXPIRY_WARNING_DAYS * DAY)
    return "EXPIRING";
  return "ACTIVE";
}

/** Bitişe kalan tam gün sayısı (en az 0). */
export function daysUntil(date: Date, now = new Date()) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / DAY));
}

/** Menü yayında mı, panelde değişiklik yapılabilir mi? */
export function isBusinessOperational(
  status: BusinessStatus,
): status is "ACTIVE" | "EXPIRING" {
  return status === "ACTIVE" || status === "EXPIRING";
}

/** Menü yayında olmadığında panelde gösterilen ve yazma işlemlerinde dönen mesaj. */
export const READ_ONLY_MESSAGES: Record<
  Exclude<BusinessStatus, "ACTIVE" | "EXPIRING">,
  string
> = {
  EXPIRED:
    "Aboneliğiniz sona erdi. Menünüz yayında değil ve değişiklik yapılamaz.",
  SUSPENDED:
    "Aboneliğiniz askıya alındı. Menünüz yayında değil ve değişiklik yapılamaz.",
  PASSIVE:
    "İşletmeniz pasif durumda. Menünüz yayında değil ve değişiklik yapılamaz.",
};
