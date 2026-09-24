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
