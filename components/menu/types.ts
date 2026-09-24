import type { AllergenLevel, Badge } from "@/lib/generated/prisma/enums";
import type { LanguageCode } from "@/lib/languages";
import type { MenuThemeCode } from "@/lib/menu-themes";
import type { OpeningHours, Socials } from "@/lib/branch-info";
import type { ServiceHours } from "@/lib/service-hours";

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
  /** Görünme saatleri (Faz 2.4); null: gün boyu. Dışında menüden çıkar. */
  hours: ServiceHours | null;
  products: MenuProduct[];
};

/** Kampanya banner'ı (Faz 2.3). Tarihler önbellekte metin olarak saklanır (ISO). */
export type MenuCampaign = {
  id: string;
  title: string;
  description: string | null;
  image: { url: string; blurDataUrl: string | null } | null;
  startsAt: string;
  endsAt: string;
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
  /** Önbellekte bitmemiş kampanyalar; istek anında yalnızca yayındakiler kalır. */
  campaigns: MenuCampaign[];
  /** Planlanmış günün önerileri ("YYYY-MM-DD"); istek anında `dailyProductId` seçilir. */
  dailySpecials: { date: string; productId: string }[];
  /** Bugünün önerisi; önbelleğe girmez, istek anında hesaplanır. */
  dailyProductId: string | null;
  /** "Öne çıkanlar" alanındaki ürünler, menü sırasıyla. */
  featuredIds: string[];
};
