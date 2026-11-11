// Ürün görselleri üç boyutta saklanır (MIMARI §9): `{url}-400.webp`, `-800`, `-1200`.
// Bu dosya hem sunucuda hem istemcide kullanılır.

export const PRODUCT_IMAGE_SIZES = [400, 800, 1200] as const;

/**
 * R2'nin ücretsiz `r2.dev` adresi Türkiye'de alan adına göre engelli; yalnızca alan
 * adını şifreleyen (ECH) tarayıcılar açabiliyor, Safari açamıyor. Bu yüzden tarayıcıya
 * giden adres kendi sunucumuzdaki `/img/…` yoluna çevrilir (app/img). Veritabanında ve
 * silme/kopyalama işlemlerinde asıl adres kullanılmaya devam eder; bu fonksiyonun
 * çıktısı yalnızca gösterim içindir, saklanmaz.
 */
export function proxiedImageUrl(url: string) {
  const match = /^https:\/\/[^/]+\.r2\.dev\/(.+)$/.exec(url);
  return match ? `/img/${match[1]}` : url;
}

/** Depodaki asıl adres: istenen genişliği karşılayan en küçük boyut. */
export function productImageOriginal(url: string, width: number) {
  const size = PRODUCT_IMAGE_SIZES.find((s) => s >= width) ?? 1200;
  return `${url}-${size}.webp`;
}

/** Tarayıcıda gösterilecek adres (bkz. proxiedImageUrl). */
export function productImageSrc(url: string, width: number) {
  return proxiedImageUrl(productImageOriginal(url, width));
}

export function productImageFiles(url: string) {
  return PRODUCT_IMAGE_SIZES.map((size) => `${url}-${size}.webp`);
}
