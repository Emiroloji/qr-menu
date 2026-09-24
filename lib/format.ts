// Fiyat ve tarih biçimlendirme tek yerden yapılır (KURALLAR 1, 6).

const TIME_ZONE = "Europe/Istanbul";
// Türkiye 2016'dan beri sabit UTC+3 kullanır.
const TR_OFFSET = "+03:00";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

/** 4550 (kuruş) → "₺45,50" */
export function formatPrice(kurus: number) {
  return priceFormatter.format(kurus / 100);
}

/** PDF'ler için: 4550 → "45,50 TL" (PDF yazı tipinde ₺ işareti yok). */
export function formatPriceText(kurus: number) {
  return `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(kurus / 100)} TL`;
}

/** "45,50", "45.50", "1.250" veya "1250" (TL) → kuruş. Geçersizse null. */
export function parsePrice(value: string): number | null {
  const trimmed = value.trim().replace(/\s|₺|TL/gi, "");
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(trimmed))
    return null;
  // Virgül varsa ondalık ayırıcıdır ve noktalar binlik ayırıcıdır.
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(trimmed)
      ? trimmed.replace(/\./g, "")
      : trimmed;
  return Math.round(Number(normalized) * 100);
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/** → "30 Eylül 2026" (Türkiye saatiyle) */
export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

/** `<input type="date">` değerini tarihe çevirir: başlangıç günün başı, bitiş günün sonu. */
export function parseDateInput(value: string, edge: "start" | "end") {
  const time = edge === "start" ? "00:00:00.000" : "23:59:59.999";
  return new Date(`${value}T${time}${TR_OFFSET}`);
}

/** Tarihi `<input type="date">` değerine çevirir (Türkiye saatiyle). */
export function toDateInputValue(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

const TR_CHARS: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  i: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/** "Kahve Dünyası Kadıköy" → "kahve-dunyasi-kadikoy" */
export function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıiöşü]/g, (c) => TR_CHARS[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
