// Toplu fiyat güncelleme hesabı (hem önizleme hem sunucu kullanır). Tüm değerler kuruştur.

export type PriceChange = {
  mode: "PERCENT" | "AMOUNT";
  direction: "INCREASE" | "DECREASE";
  /** Yüzde (ör. 10) veya kuruş (ör. 500 = 5 TL) */
  value: number;
  /** Sonucun yuvarlanacağı birim, kuruş (0 = yuvarlama yok) */
  rounding: number;
};

export function applyPriceChange(price: number, change: PriceChange) {
  const sign = change.direction === "INCREASE" ? 1 : -1;
  const raw =
    change.mode === "PERCENT"
      ? price * (1 + (sign * change.value) / 100)
      : price + sign * change.value;
  const rounded =
    change.rounding > 0
      ? Math.round(raw / change.rounding) * change.rounding
      : Math.round(raw);
  return rounded;
}
