// Müşteri menüsü temaları (Faz 0.1 tasarımı). Her tema aynı veriyi alır; yalnızca düzen,
// yazı tipi ve renkler değişir (KURALLAR 8). Renkler CSS değişkeni olarak sayfaya aktarılır.

import { contrastRatio, onColor, readableOn } from "@/lib/color";
import { canUseBranding, canUseCover } from "@/lib/plan-features";
import type { PlanFeatures } from "@/lib/validations/plan";

type Palette = {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  photo: string;
};

export const MENU_THEMES = {
  minimal: {
    label: "Minimal",
    description: "Sade, açık zemin, fotoğraflı liste",
    defaultColor: "#2F5D50",
    fonts: { display: "--font-geist-sans", body: "--font-geist-sans" },
    light: {
      bg: "#F7F6F3",
      surface: "#FFFFFF",
      ink: "#1B1B19",
      muted: "#5F5E59",
      line: "#E4E2DC",
      photo: "#EAE7E0",
    },
    dark: {
      bg: "#121211",
      surface: "#1C1C1A",
      ink: "#F1EFEA",
      muted: "#A7A49D",
      line: "#2E2D2A",
      photo: "#252422",
    },
  },
  luxury: {
    label: "Lüks",
    description: "Koyu zemin, klasik yazı, fotoğrafsız zarif liste",
    defaultColor: "#C9A96E",
    fonts: { display: "--font-cormorant", body: "--font-jost" },
    // Tema her zaman koyudur.
    light: {
      bg: "#15130F",
      surface: "#1D1A15",
      ink: "#EDE6D8",
      muted: "#B3AA99",
      line: "#2B2721",
      photo: "#26221B",
    },
    dark: {
      bg: "#15130F",
      surface: "#1D1A15",
      ink: "#EDE6D8",
      muted: "#B3AA99",
      line: "#2B2721",
      photo: "#26221B",
    },
  },
  warm: {
    label: "Sıcak",
    description: "Krem zemin, kapak görseli, iki sütunlu kartlar",
    defaultColor: "#B4532A",
    fonts: { display: "--font-fraunces", body: "--font-nunito-sans" },
    light: {
      bg: "#FBF4E9",
      surface: "#FFFFFF",
      ink: "#2B1E16",
      muted: "#6F5A4B",
      line: "#EFE2CF",
      photo: "#EBD9C2",
    },
    dark: {
      bg: "#1F1712",
      surface: "#2A201A",
      ink: "#F5EBDD",
      muted: "#C4B3A2",
      line: "#3A2E25",
      photo: "#3A2C22",
    },
  },
  vibrant: {
    label: "Canlı",
    description: "Canlı renkler, büyük başlıklar, kalın çerçeveler",
    defaultColor: "#2436D9",
    fonts: { display: "--font-bricolage", body: "--font-bricolage" },
    light: {
      bg: "#FFFFFF",
      surface: "#FFFFFF",
      ink: "#111111",
      muted: "#4B4B4B",
      line: "#111111",
      photo: "#E9ECFB",
    },
    dark: {
      bg: "#0E0F1A",
      surface: "#171A2B",
      ink: "#F5F6FF",
      muted: "#A9ADC8",
      line: "#F5F6FF",
      photo: "#22263D",
    },
  },
} satisfies Record<
  string,
  {
    label: string;
    description: string;
    defaultColor: string;
    fonts: { display: string; body: string };
    light: Palette;
    dark: Palette;
  }
>;

export type MenuThemeCode = keyof typeof MENU_THEMES;
export const MENU_THEME_CODES = Object.keys(MENU_THEMES) as MenuThemeCode[];
/** Canlı temanın ikinci vurgu rengi. */
const HIGHLIGHT = "#D8F55A";

export function isMenuTheme(value: string): value is MenuThemeCode {
  return value in MENU_THEMES;
}

function variables(
  palette: Palette,
  brand: string,
  fonts: { display: string; body: string },
  theme: MenuThemeCode,
) {
  // Koyu zeminde koyu marka rengi görünmez: en az 3:1 olana kadar açılır.
  let accent =
    contrastRatio(brand, palette.bg) >= 3
      ? brand
      : readableOn(brand, palette.bg, 3);
  // Vurgu üzerindeki küçük metin (çip, rozet) en az 4.5:1 olmalı; orta tonlar ayarlanır.
  const text = onColor(accent);
  if (contrastRatio(text, accent) < 4.5) accent = readableOn(accent, text, 4.5);
  const highlight = theme === "vibrant" ? HIGHLIGHT : accent;
  return {
    "--m-bg": palette.bg,
    "--m-surface": palette.surface,
    "--m-ink": palette.ink,
    "--m-muted": palette.muted,
    "--m-line": palette.line,
    "--m-photo": palette.photo,
    "--m-accent": accent,
    "--m-on-accent": onColor(accent),
    // Metin olarak kullanılan vurgu, zeminde en az 4.5:1 (WCAG AA).
    "--m-accent-text": readableOn(accent, palette.bg),
    "--m-highlight": highlight,
    "--m-on-highlight": onColor(highlight),
    "--m-font-display": `var(${fonts.display})`,
    "--m-font-body": `var(${fonts.body})`,
  };
}

export function themeVariables(theme: MenuThemeCode, brand: string) {
  const def = MENU_THEMES[theme];
  return {
    light: variables(def.light, brand, def.fonts, theme),
    dark: variables(def.dark, brand, def.fonts, theme),
  };
}

/** Paketin izin vermediği görünüm ayarları (paket düşürülmüş olabilir) yok sayılır. */
export function effectiveAppearance(
  business: {
    theme: string;
    primaryColor: string;
    logoUrl: string | null;
    coverUrl: string | null;
  },
  features: PlanFeatures,
) {
  const theme: MenuThemeCode = isMenuTheme(business.theme)
    ? business.theme
    : "minimal";
  const branding = canUseBranding(features);
  return {
    theme,
    color: branding ? business.primaryColor : MENU_THEMES[theme].defaultColor,
    logoUrl: branding ? business.logoUrl : null,
    coverUrl: canUseCover(features) ? business.coverUrl : null,
  };
}
