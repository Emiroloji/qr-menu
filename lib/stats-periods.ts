// İstatistik dönemleri Türkiye saatine göre hesaplanır (Türkiye sabit UTC+3).
// Bu dosya saf fonksiyonlardan oluşur; sorgular lib/stats.ts içindedir.

const OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const GRANULARITIES = {
  day: { label: "Günlük", count: 30, description: "Son 30 gün" },
  week: { label: "Haftalık", count: 12, description: "Son 12 hafta" },
  month: { label: "Aylık", count: 12, description: "Son 12 ay" },
} as const;
export type Granularity = keyof typeof GRANULARITIES;

export function isGranularity(value: unknown): value is Granularity {
  return typeof value === "string" && Object.hasOwn(GRANULARITIES, value);
}

/** Ayrıntılı istatistiklerin (saat, dil, ürün) kapsadığı gün sayıları. */
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: unknown): Range {
  const n = Number(value);
  return RANGES.find((r) => r === n) ?? 30;
}

/** Türkiye saatiyle günün başı (UTC Date olarak). */
export function startOfDay(date: Date) {
  const local = date.getTime() + OFFSET_MS;
  return new Date(local - (local % DAY_MS) - OFFSET_MS);
}

/** `days` gün önceki günün başı; bugün dahil `days` günü kapsar. */
export function daysAgo(now: Date, days: number) {
  return new Date(startOfDay(now).getTime() - (days - 1) * DAY_MS);
}

/** Tarihin Türkiye saatine kaydırılmış hali; UTC alıcılarıyla okunur. */
const local = (date: Date) => new Date(date.getTime() + OFFSET_MS);
const toUtc = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m, d) - OFFSET_MS);

/** Dönemin başladığı an (Türkiye saatiyle gün, pazartesi başlayan hafta veya ay). */
export function startOfBucket(granularity: Granularity, date: Date) {
  const l = local(date);
  const [y, m, d] = [l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate()];
  if (granularity === "month") return toUtc(y, m, 1);
  if (granularity === "week") return toUtc(y, m, d - ((l.getUTCDay() + 6) % 7));
  return toUtc(y, m, d);
}

/** Dönem anahtarı: veritabanının `to_char(..., 'YYYY-MM-DD')` çıktısıyla aynı. */
export function bucketKey(start: Date) {
  return local(start).toISOString().slice(0, 10);
}

const shortDay = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const monthYear = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export type Bucket = { key: string; start: Date; label: string };

/** Şimdiki dönem dahil son `count` dönem, eskiden yeniye. */
export function buckets(granularity: Granularity, now: Date): Bucket[] {
  const count = GRANULARITIES[granularity].count;
  const current = local(startOfBucket(granularity, now));
  const [y, m, d] = [
    current.getUTCFullYear(),
    current.getUTCMonth(),
    current.getUTCDate(),
  ];
  return Array.from({ length: count }, (_, i) => {
    const back = count - 1 - i;
    const start =
      granularity === "month"
        ? toUtc(y, m - back, 1)
        : toUtc(y, m, d - back * (granularity === "week" ? 7 : 1));
    const label = (granularity === "month" ? monthYear : shortDay).format(
      local(start),
    );
    return { key: bucketKey(start), start, label };
  });
}

/** Önceki döneme göre değişim yüzdesi; önceki dönem boşsa null. */
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
