// Kampanya, günün önerisi ve öne çıkan ürün kuralları (Faz 2.3). Saf fonksiyonlar;
// hem panelde hem müşteri menüsünde kullanılır.

/** Bir şubede aynı anda öne çıkarılabilecek en fazla ürün. */
export const MAX_FEATURED_PRODUCTS = 10;
/** Günün önerisi en fazla bu kadar gün ileriye planlanabilir. */
export const MAX_SPECIAL_DAYS_AHEAD = 60;

export type CampaignStatus = "LIVE" | "SCHEDULED" | "ENDED" | "OFF";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  LIVE: "Yayında",
  SCHEDULED: "Planlandı",
  ENDED: "Sona erdi",
  OFF: "Kapalı",
};

type CampaignDates = { isActive: boolean; startsAt: Date; endsAt: Date };

export function campaignStatus(
  campaign: CampaignDates,
  now = new Date(),
): CampaignStatus {
  if (campaign.endsAt <= now) return "ENDED";
  if (!campaign.isActive) return "OFF";
  if (campaign.startsAt > now) return "SCHEDULED";
  return "LIVE";
}

export const isCampaignLive = (campaign: CampaignDates, now = new Date()) =>
  campaignStatus(campaign, now) === "LIVE";

/** Günün önerisi tarihi (`@db.Date`) ↔ "YYYY-MM-DD". Tarih sütunu UTC gece yarısıdır. */
export const specialDateKey = (date: Date) => date.toISOString().slice(0, 10);
export const specialDateFromKey = (key: string) => new Date(`${key}T00:00:00Z`);
