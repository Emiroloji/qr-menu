import type { AllergenLevel, Badge } from "@/lib/generated/prisma/enums";
import type { LanguageCode } from "@/lib/languages";
import type { MenuThemeCode } from "@/lib/menu-themes";
import type { OpeningHours, Socials } from "@/lib/validations/branch";

// Her temanın aldığı ortak veri yapısı (KURALLAR 8). Metinler seçilen dile çevrilmiştir;
// çevirisi olmayan alan Türkçe gelir.

export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  image: { url: string; blurDataUrl: string | null } | null;
  variants: { name: string | null; price: number }[];
  badges: Badge[];
  isAvailable: boolean;
  spiceLevel: number;
  allergens: { code: string; name: string; level: AllergenLevel }[];
  tags: { code: string; name: string }[];
  ingredients: string | null;
  portion: string | null;
  prepTime: number | null;
  origin: string | null;
  nutrition: Record<
    "calories" | "protein" | "carbs" | "fat" | "sugar" | "salt",
    number | null
  > | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  description: string | null;
  products: MenuProduct[];
};

export type MenuData = {
  lang: LanguageCode;
  appearance: {
    theme: MenuThemeCode;
    color: string;
    logoUrl: string | null;
    coverUrl: string | null;
  };
  business: { name: string };
  branch: {
    name: string;
    address: string | null;
    phone: string | null;
    wifi: string | null;
    socials: Socials;
    openingHours: OpeningHours;
    /** Bugünün çalışma saati, ör. "08:00–23:00"; kapalıysa null */
    todayHours: string | null;
  };
  categories: MenuCategory[];
};
