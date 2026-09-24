// Menünün sunulabildiği diller. Türkçe ana dildir ve her şubede açıktır;
// Türkçe metin ana alanlarda, diğerleri `translations` JSON alanında tutulur (MIMARI §4).

export const LANGUAGES = [
  { code: "tr", name: "Türkçe", native: "Türkçe", dir: "ltr" },
  { code: "en", name: "İngilizce", native: "English", dir: "ltr" },
  { code: "de", name: "Almanca", native: "Deutsch", dir: "ltr" },
  { code: "ru", name: "Rusça", native: "Русский", dir: "ltr" },
  { code: "ar", name: "Arapça", native: "العربية", dir: "rtl" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: LanguageCode = "tr";

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGES.some((l) => l.code === value);
}

export function getLanguage(code: LanguageCode) {
  return LANGUAGES.find((l) => l.code === code)!;
}

/**
 * Menü dili: adresteki `?lang` şubede açıksa o; yoksa tarayıcı dili (Accept-Language)
 * şubede açıksa o; hiçbiri değilse Türkçe.
 */
export function pickLanguage(
  requested: string | null,
  available: string[],
  acceptLanguage: string | null,
): LanguageCode {
  const allowed = available.filter(isLanguageCode);
  if (requested && isLanguageCode(requested) && allowed.includes(requested))
    return requested;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { code: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .find((p) => isLanguageCode(p.code) && allowed.includes(p.code));
  return (preferred?.code as LanguageCode | undefined) ?? DEFAULT_LANGUAGE;
}
