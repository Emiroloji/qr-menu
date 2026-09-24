// Menü araması ve alerjen/diyet filtresi (istemcide çalışır, saf fonksiyon).

export type FilterableProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryName: string;
  ingredients: string | null;
  allergens: { code: string; level: "CONTAINS" | "MAY_CONTAIN" }[];
  tags: { code: string }[];
};

export type MenuFilter = { query: string; exclude: string[]; diets: string[] };

/** Büyük/küçük harf ve Türkçe karakterden bağımsız karşılaştırma: "Çay" ~ "cay" */
export function normalize(text: string) {
  return text
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

export type FilterResult<T> = { product: T; traces: string[] };

/**
 * - `exclude`: bu alerjenleri **içeren** ürünler çıkar; yalnızca **iz** içerenler kalır ama uyarıyla.
 * - `diets`: seçilen etiketlerin hepsine sahip ürünler kalır.
 */
export function filterProducts<T extends FilterableProduct>(
  products: T[],
  filter: MenuFilter,
): FilterResult<T>[] {
  const words = normalize(filter.query).split(/\s+/).filter(Boolean);
  return products.flatMap((product) => {
    if (
      product.allergens.some(
        (a) => a.level === "CONTAINS" && filter.exclude.includes(a.code),
      )
    )
      return [];
    if (!filter.diets.every((d) => product.tags.some((t) => t.code === d)))
      return [];
    if (words.length) {
      const haystack = normalize(
        [
          product.name,
          product.description,
          product.categoryName,
          product.ingredients,
        ]
          .filter(Boolean)
          .join(" "),
      );
      if (!words.every((w) => haystack.includes(w))) return [];
    }
    const traces = product.allergens
      .filter(
        (a) => a.level === "MAY_CONTAIN" && filter.exclude.includes(a.code),
      )
      .map((a) => a.code);
    return [{ product, traces }];
  });
}
