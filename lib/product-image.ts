// Ürün görselleri üç boyutta saklanır (MIMARI §9): `{url}-400.webp`, `-800`, `-1200`.
// Bu dosya hem sunucuda hem istemcide kullanılır.

export const PRODUCT_IMAGE_SIZES = [400, 800, 1200] as const;

/** İstenen genişliği karşılayan en küçük boyutun adresi. */
export function productImageSrc(url: string, width: number) {
  const size = PRODUCT_IMAGE_SIZES.find((s) => s >= width) ?? 1200;
  return `${url}-${size}.webp`;
}

export function productImageFiles(url: string) {
  return PRODUCT_IMAGE_SIZES.map((size) => `${url}-${size}.webp`);
}
