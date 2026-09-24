import "server-only";
import type { MenuData } from "@/components/menu/types";
import { getCurrentSubscription } from "@/lib/business-status";
import { db } from "@/lib/db";
import type { LanguageCode } from "@/lib/languages";
import { effectiveAppearance } from "@/lib/menu-themes";
import { readPlanFeatures } from "@/lib/plan-features";
import { readTranslations } from "@/lib/translations";
import {
  DAYS,
  type OpeningHours,
  type Socials,
} from "@/lib/validations/branch";

type Translatable = {
  name: string;
  description?: string | null;
  translations: unknown;
};

/** Seçilen dildeki metin; çeviri yoksa Türkçe (MIMARI §4). */
function translate<T extends Translatable>(item: T, lang: LanguageCode) {
  const t =
    lang === "tr" ? undefined : readTranslations(item.translations)[lang];
  return {
    name: t?.name || item.name,
    description: t?.description || item.description || null,
  };
}

function todayHours(hours: OpeningHours, now: Date) {
  // Pazartesi = 0 (Türkiye saatiyle)
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Europe/Istanbul",
  })
    .format(now)
    .toLowerCase();
  const day = DAYS.find(([d]) => d === weekday.slice(0, 3))?.[0];
  const ranges = day ? hours[day] : undefined;
  return ranges?.length ? ranges.map((r) => r.join("–")).join(", ") : null;
}

/** Bir şubenin görünür menüsü (gizli kategori ve ürünler hariç). */
export async function getMenuData(
  branchId: string,
  lang: LanguageCode,
): Promise<MenuData | null> {
  const branch = await db.branch.findUnique({
    where: { id: branchId, deletedAt: null },
    include: {
      business: { include: { subscriptions: { include: { plan: true } } } },
      categories: {
        where: { deletedAt: null, isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { deletedAt: null, isVisible: true },
            orderBy: { sortOrder: "asc" },
            include: {
              variants: { orderBy: { sortOrder: "asc" } },
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
              allergens: { include: { allergen: true } },
              tags: { include: { tag: true } },
              nutrition: true,
            },
          },
        },
      },
    },
  });
  if (!branch) return null;

  const plan = getCurrentSubscription(branch.business.subscriptions)?.plan;
  const openingHours = branch.openingHours as OpeningHours;

  return {
    lang,
    appearance: effectiveAppearance(
      branch.business,
      readPlanFeatures(plan?.features),
    ),
    business: { name: branch.business.name },
    branch: {
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      wifi: branch.wifi,
      socials: branch.socials as Socials,
      openingHours,
      todayHours: todayHours(openingHours, new Date()),
    },
    categories: branch.categories
      .map((category) => ({
        id: category.id,
        ...translate(category, lang),
        products: category.products.map((p) => ({
          id: p.id,
          ...translate(p, lang),
          image: p.images[0]
            ? { url: p.images[0].url, blurDataUrl: p.images[0].blurDataUrl }
            : null,
          variants: p.variants.map((v) => ({
            name: v.name
              ? translate({ name: v.name, translations: v.translations }, lang)
                  .name
              : null,
            price: v.price,
          })),
          badges: p.badges,
          isAvailable: p.isAvailable,
          spiceLevel: p.spiceLevel,
          allergens: p.allergens.map((a) => ({
            code: a.allergen.code,
            name: translate(a.allergen, lang).name,
            level: a.level,
          })),
          tags: p.tags.map((t) => ({
            code: t.tag.code,
            name: translate(t.tag, lang).name,
          })),
          ingredients: p.ingredients,
          portion: p.portion,
          prepTime: p.prepTime,
          origin: p.origin,
          nutrition: p.nutrition
            ? {
                calories: p.nutrition.calories,
                protein: p.nutrition.protein,
                carbs: p.nutrition.carbs,
                fat: p.nutrition.fat,
                sugar: p.nutrition.sugar,
                salt: p.nutrition.salt,
              }
            : null,
        })),
      }))
      .filter((c) => c.products.length > 0),
  };
}
