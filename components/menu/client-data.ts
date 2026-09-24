import { formatPrice } from "@/lib/format";
import { getLanguage, type LanguageCode } from "@/lib/languages";
import type { MenuLabels, MenuMessages } from "./labels";
import type { MenuData, MenuProduct } from "./types";

// Sunucuda hazırlanıp istemci parçalarına (detay kartı, arama, bilgi) verilen veri.
// Biçimlendirme sunucuda yapılır; istemciye yalnızca düz metin gider.

export type ClientProduct = Omit<MenuProduct, "variants"> & {
  categoryId: string;
  categoryName: string;
  priceText: string;
  variants: { name: string | null; priceText: string }[];
};

export type MenuClientData = {
  lang: LanguageCode;
  dir: "ltr" | "rtl";
  text: MenuMessages;
  products: ClientProduct[];
  allergens: { code: string; name: string }[];
  tags: { code: string; name: string }[];
  languages: {
    code: LanguageCode;
    native: string;
    href: string;
    current: boolean;
  }[];
  branch: MenuData["branch"] & { businessName: string; todayText: string };
  /** Şubenin alerjen tablosu (PDF, seçili dilde; Faz 2.1). Önizlemede yok. */
  allergenPdfUrl: string | null;
};

export function priceText(
  product: Pick<MenuProduct, "variants">,
  labels: MenuLabels,
) {
  const prices = product.variants.map((v) => v.price);
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  return prices.length > 1 ? labels.from(formatPrice(min)) : formatPrice(min);
}

export function buildClientData(
  data: MenuData,
  labels: MenuLabels,
  messages: MenuMessages,
  options: {
    allergens: { code: string; name: string }[];
    tags: { code: string; name: string }[];
    languages: LanguageCode[];
    /** Dil bağlantısı için sayfa yolu, ör. /limon-kafe/kadikoy */
    path: string;
    branchId: string | null;
  },
): MenuClientData {
  return {
    lang: data.lang,
    dir: getLanguage(data.lang).dir,
    text: messages,
    products: data.categories.flatMap((category) =>
      category.products.map((p) => ({
        ...p,
        categoryId: category.id,
        categoryName: category.name,
        priceText: priceText(p, labels),
        variants: p.variants.map((v) => ({
          name: v.name,
          priceText: formatPrice(v.price),
        })),
      })),
    ),
    allergens: options.allergens,
    tags: options.tags,
    languages: options.languages.map((code) => ({
      code,
      native: getLanguage(code).native,
      href: `${options.path}?lang=${code}`,
      current: code === data.lang,
    })),
    allergenPdfUrl: options.branchId
      ? `/api/pdf/${options.branchId}?type=allergens&lang=${data.lang}`
      : null,
    branch: {
      ...data.branch,
      businessName: data.business.name,
      todayText: data.branch.todayHours
        ? labels.todayHours(data.branch.todayHours)
        : labels.closedToday,
    },
  };
}
