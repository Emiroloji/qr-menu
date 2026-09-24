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

/** Menü yayında mı, panelde değişiklik yapılabilir mi? */
export function isBusinessOperational(status: BusinessStatus) {
  return status === "ACTIVE" || status === "EXPIRING";
}
