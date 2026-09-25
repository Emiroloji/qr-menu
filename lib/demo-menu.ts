import type { MenuData, MenuProduct } from "@/components/menu/types";
import { toDateInputValue } from "@/lib/format";
import type { MenuThemeCode } from "@/lib/menu-themes";

// Tanıtım sayfasındaki örnek menü (Faz 3.4). Hayali bir işletmedir; veritabanına
// bağlı değildir, tarama veya istatistik kaydı yazmaz.

type ProductInput = Partial<MenuProduct> &
  Pick<MenuProduct, "id" | "name" | "variants">;

const product = (p: ProductInput): MenuProduct => ({
  description: null,
  image: null,
  badges: [],
  isAvailable: true,
  spiceLevel: 0,
  allergens: [],
  tags: [],
  ingredients: null,
  portion: null,
  prepTime: null,
  origin: null,
  nutrition: null,
  ...p,
});

const milk = { code: "milk", name: "Süt", level: "CONTAINS" as const };
const gluten = { code: "gluten", name: "Gluten", level: "CONTAINS" as const };
const eggs = { code: "eggs", name: "Yumurta", level: "CONTAINS" as const };
const nutsTrace = {
  code: "tree_nuts",
  name: "Sert kabuklu yemişler",
  level: "MAY_CONTAIN" as const,
};
const vegetarian = { code: "vegetarian", name: "Vejetaryen" };
const vegan = { code: "vegan", name: "Vegan" };

export const DEMO_THEMES: { code: MenuThemeCode; label: string }[] = [
  { code: "minimal", label: "Minimal" },
  { code: "luxury", label: "Lüks" },
  { code: "warm", label: "Sıcak" },
  { code: "vibrant", label: "Canlı" },
];

export function demoMenu(theme: MenuThemeCode, now = new Date()): MenuData {
  const day = 24 * 60 * 60 * 1000;
  return {
    lang: "tr",
    appearance: { theme, color: "#1F4D40", logoUrl: null, coverUrl: null },
    business: { name: "Örnek Kahve Evi" },
    branch: {
      name: "Moda",
      address: "Örnek Mah. Deneme Sok. No: 1, Kadıköy/İstanbul",
      phone: "0 (216) 000 00 00",
      wifi: "OrnekKahve · misafir2026",
      socials: { instagram: "ornekkahveevi" },
      openingHours: Object.fromEntries(
        ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [
          d,
          [["08:00", "23:00"]],
        ]),
      ),
      todayHours: null,
    },
    categories: [
      {
        id: "demo-kahve",
        name: "Kahveler",
        description: "Çekirdeklerimiz haftada iki kez kavrulur.",
        hours: null,
        products: [
          product({
            id: "demo-latte",
            name: "Latte",
            description: "Çift shot espresso ve buharda ısıtılmış süt.",
            variants: [
              { name: "Küçük · 250 ml", price: 8500 },
              { name: "Büyük · 400 ml", price: 10500 },
            ],
            badges: ["POPULAR"],
            allergens: [milk],
            tags: [vegetarian],
            prepTime: 4,
            nutrition: {
              calories: 190,
              protein: 10,
              carbs: 15,
              fat: 9,
              sugar: 14,
              salt: 0.3,
            },
          }),
          product({
            id: "demo-turk-kahvesi",
            name: "Türk Kahvesi",
            description: "Közde pişirilir, lokum ile servis edilir.",
            variants: [{ name: null, price: 7000 }],
            tags: [vegan],
            prepTime: 8,
            origin: "Brezilya",
          }),
          product({
            id: "demo-soguk-demleme",
            name: "Soğuk Demleme",
            description: "18 saat soğukta demlenmiş, yumuşak içimli.",
            variants: [{ name: null, price: 9500 }],
            badges: ["NEW"],
            tags: [vegan],
          }),
          product({
            id: "demo-mocha",
            name: "Mocha",
            description: "Espresso, bitter çikolata sosu ve süt.",
            variants: [{ name: null, price: 11000 }],
            allergens: [milk, nutsTrace],
            isAvailable: false,
          }),
        ],
      },
      {
        id: "demo-kahvalti",
        name: "Kahvaltı",
        description: null,
        hours: null,
        products: [
          product({
            id: "demo-menemen",
            name: "Menemen",
            description: "Tereyağında domates, biber ve köy yumurtası.",
            variants: [{ name: null, price: 16500 }],
            allergens: [eggs, milk],
            tags: [vegetarian],
            spiceLevel: 1,
            prepTime: 12,
          }),
          product({
            id: "demo-simit-tabagi",
            name: "Simit Tabağı",
            description: "Simit, beyaz peynir, domates, zeytin ve bal.",
            variants: [{ name: null, price: 14000 }],
            allergens: [gluten, milk],
            tags: [vegetarian],
            badges: ["CHEFS_CHOICE"],
          }),
        ],
      },
      {
        id: "demo-tatli",
        name: "Tatlılar",
        description: null,
        hours: null,
        products: [
          product({
            id: "demo-cheesecake",
            name: "San Sebastian Cheesecake",
            description: "Yanık yüzeyli, akışkan kıvamlı.",
            variants: [{ name: null, price: 16000 }],
            allergens: [gluten, eggs, milk],
            badges: ["POPULAR"],
          }),
          product({
            id: "demo-havuc-kek",
            name: "Havuçlu Kek",
            description: "Tarçınlı, cevizli; üzeri krem peynirli.",
            variants: [{ name: null, price: 12000 }],
            allergens: [gluten, eggs, milk, nutsTrace],
          }),
        ],
      },
    ],
    campaigns: [
      {
        id: "demo-kampanya",
        title: "Hafta içi 15:00–17:00 tatlılarda %20 indirim",
        description: "Kahvenizin yanına bir dilim cheesecake.",
        image: null,
        startsAt: new Date(now.getTime() - day).toISOString(),
        endsAt: new Date(now.getTime() + 30 * day).toISOString(),
      },
    ],
    dailySpecials: [
      { date: toDateInputValue(now), productId: "demo-simit-tabagi" },
    ],
    dailyProductId: null,
    featuredIds: ["demo-latte", "demo-soguk-demleme", "demo-cheesecake"],
  };
}
