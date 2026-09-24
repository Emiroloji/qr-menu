import "server-only";
import ar from "@/messages/ar.json";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import tr from "@/messages/tr.json";
import type { LanguageCode } from "@/lib/languages";

// Müşteri menüsündeki sabit yazılar (next-intl mesajları, MIMARI §2).
const MESSAGES = { tr, en, de, ru, ar } satisfies Record<
  LanguageCode,
  typeof tr
>;
export type MenuMessages = (typeof tr)["menu"];

export function getMenuMessages(lang: LanguageCode): MenuMessages {
  return MESSAGES[lang].menu;
}
