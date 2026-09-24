import "server-only";
import { unstable_cache } from "next/cache";
import type { MenuData } from "@/components/menu/types";
import { getCurrentSubscription } from "@/lib/business-status";
import { branchTag, MENU_LOOKUP_TAG } from "@/lib/cache";
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

export function todayHours(hours: OpeningHours, now: Date) {
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
      // Güne bağlıdır; önbelleğe girmez, `withTodayHours` ile istek anında hesaplanır.
      todayHours: null,
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

/** Bugünün çalışma saatini (Türkiye saatiyle) ekler. */
export function withTodayHours(data: MenuData, now = new Date()): MenuData {
  return {
    ...data,
    branch: {
      ...data.branch,
      todayHours: todayHours(data.branch.openingHours, now),
    },
  };
}

/**
 * Önbellekli menü verisi (MIMARI §8): `branch:{id}` etiketiyle saklanır; paneldeki her
 * değişiklik bu etiketi temizler. Güvenlik ağı olarak en geç bir saatte yenilenir.
 */
export function getCachedMenuData(branchId: string, lang: LanguageCode) {
  return unstable_cache(
    () => getMenuData(branchId, lang),
    ["menu-data", branchId, lang],
    {
      tags: [branchTag(branchId)],
      revalidate: 3600,
    },
  )();
}

/** Menü adresinden şube, işletme durumu ve diller. Abonelik tarihleri metin olarak saklanır. */
export const getMenuLookup = unstable_cache(
  async (businessSlug: string, branchSlug: string) => {
    const branch = await db.branch.findFirst({
      where: {
        slug: branchSlug,
        deletedAt: null,
        business: { slug: businessSlug, deletedAt: null },
      },
      include: {
        business: {
          select: {
            name: true,
            isActive: true,
            subscriptions: {
              select: { status: true, startsAt: true, endsAt: true },
            },
          },
        },
      },
    });
    if (!branch) return null;
    return {
      branchId: branch.id,
      branchName: branch.name,
      businessName: branch.business.name,
      languages: branch.languages,
      isActive: branch.business.isActive,
      subscriptions: branch.business.subscriptions.map((s) => ({
        status: s.status,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
      })),
    };
  },
  ["menu-lookup"],
  { tags: [MENU_LOOKUP_TAG], revalidate: 3600 },
);

/** Arama filtresindeki 14 alerjen ve diyet etiketi (seçilen dilde). */
export const getMenuReference = unstable_cache(
  async (lang: LanguageCode) => {
    const [allergens, tags] = await Promise.all([
      db.allergen.findMany(),
      db.tag.findMany(),
    ]);
    const sort = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name, lang);
    return {
      allergens: allergens
        .map((a) => ({ code: a.code, name: translate(a, lang).name }))
        .sort(sort),
      tags: tags
        .map((t) => ({ code: t.code, name: translate(t, lang).name }))
        .sort(sort),
    };
  },
  ["menu-reference"],
  { revalidate: 86400 },
);
