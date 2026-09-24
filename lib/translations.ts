import type { LanguageCode } from "@/lib/languages";

/** `translations` JSON alanı: { "en": { "name": "Latte", "description": "..." } } */
export type Translations = Partial<
  Record<LanguageCode, { name?: string; description?: string }>
>;

export function readTranslations(value: unknown): Translations {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Translations)
    : {};
}

type Translatable = {
  name: string | null;
  description?: string | null;
  translations: unknown;
};

/** Türkçesi dolu olup seçilen dilde karşılığı boş olan alanlar. */
export function missingFields(item: Translatable, lang: LanguageCode) {
  const t = readTranslations(item.translations)[lang] ?? {};
  const missing: ("name" | "description")[] = [];
  if (item.name && !t.name?.trim()) missing.push("name");
  if (item.description && !t.description?.trim()) missing.push("description");
  return missing;
}

/** Ürün, kendisi veya adı olan boylarından biri çevrilmemişse eksiktir. */
export function isProductMissing(
  product: Translatable & { variants: Translatable[] },
  lang: LanguageCode,
) {
  return (
    missingFields(product, lang).length > 0 ||
    product.variants.some((v) => missingFields(v, lang).length > 0)
  );
}

/** Çeviriyi günceller; boş değer alanı kaldırır. Diğer dillere dokunmaz. */
export function setTranslation(
  current: unknown,
  lang: LanguageCode,
  values: { name?: string; description?: string },
): Translations {
  const all = { ...readTranslations(current) };
  const next = { ...(all[lang] ?? {}) };
  for (const [key, value] of Object.entries(values) as [
    "name" | "description",
    string | undefined,
  ][]) {
    if (value === undefined) continue;
    const trimmed = value.trim();
    if (trimmed) next[key] = trimmed;
    else delete next[key];
  }
  if (Object.keys(next).length) all[lang] = next;
  else delete all[lang];
  return all;
}
