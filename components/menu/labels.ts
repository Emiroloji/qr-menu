import { createTranslator } from "next-intl";
import type { LanguageCode } from "@/lib/languages";
import type messages from "@/messages/tr.json";

export type MenuMessages = (typeof messages)["menu"];

/** Menü yazıları (next-intl). Sunucu temaları ve panel önizlemesi kullanır. */
export function createMenuLabels(
  lang: LanguageCode,
  menuMessages: MenuMessages,
) {
  const t = createTranslator({
    locale: lang,
    messages: { menu: menuMessages },
    namespace: "menu",
  });
  return {
    t,
    soldOut: t("soldOut"),
    from: (price: string) => t("from", { price }),
    todayHours: (hours: string) => t("todayHours", { hours }),
    closedToday: t("closedToday"),
    wifi: t("wifi"),
    address: t("address"),
    info: t("info"),
    search: t("search"),
    language: t("language"),
    categories: t("categories"),
    cover: t("cover"),
    badges: {
      CHEFS_CHOICE: t("CHEFS_CHOICE"),
      NEW: t("NEW"),
      POPULAR: t("POPULAR"),
    },
    spice: t("spice"),
    photoOf: (name: string) => t("photoOf", { name }),
    logoOf: (name: string) => t("logoOf", { name }),
  };
}
export type MenuLabels = ReturnType<typeof createMenuLabels>;
