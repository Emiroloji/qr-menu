import "server-only";
import { getLanguage, isLanguageCode } from "@/lib/languages";

/** Kampanya formunda çeviri alanı gösterilecek diller (Türkçe hariç). */
export function translationLanguages(languages: string[]) {
  return languages
    .filter(isLanguageCode)
    .filter((code) => code !== "tr")
    .map((code) => ({ code, name: getLanguage(code).name }));
}
