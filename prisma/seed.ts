import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import {
  PrismaClient,
  type AllergenLevel,
  type Badge,
  type Permission,
  type Role,
} from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const isProduction = process.env.NODE_ENV === "production";

// ---------- Sabit veriler ----------

// Yasal olarak tanımlı 14 alerjen (proje-tanitimi.md). `icon` şimdilik kod ile aynı;
// ikon seti Faz 1.10'da belirlenir.
const ALLERGENS = [
  ["gluten", "Gluten", "Gluten"],
  ["crustaceans", "Kabuklular", "Crustaceans"],
  ["molluscs", "Yumuşakçalar", "Molluscs"],
  ["eggs", "Yumurta", "Eggs"],
  ["fish", "Balık", "Fish"],
  ["peanuts", "Yer fıstığı", "Peanuts"],
  ["tree_nuts", "Sert kabuklu yemişler", "Tree nuts"],
  ["soy", "Soya", "Soy"],
  ["milk", "Süt", "Milk"],
  ["celery", "Kereviz", "Celery"],
  ["mustard", "Hardal", "Mustard"],
  ["sesame", "Susam", "Sesame"],
  ["sulphites", "Sülfit", "Sulphites"],
  ["lupin", "Acı bakla", "Lupin"],
] as const;

const TAGS = [
  ["vegan", "Vegan", "Vegan"],
  ["vegetarian", "Vejetaryen", "Vegetarian"],
  ["gluten_free", "Glutensiz", "Gluten-free"],
  ["halal", "Helal", "Halal"],
] as const;

// Paket fiyatları kaynakta yok: 0 girilir, süper admin panelden belirler.
// Limitlerde null = sınırsız.
const PLANS = [
  {
    name: "Başlangıç",
    price: 0,
    maxBranches: 1,
    maxProducts: 50,
    maxStaff: 1,
    maxLanguages: 1,
    features: { appearance: "PRESET", stats: "NONE" },
  },
  {
    name: "Standart",
    price: 0,
    maxBranches: 3,
    maxProducts: 300,
    maxStaff: 5,
    maxLanguages: 2,
    features: { appearance: "BRANDING", stats: "BASIC" },
  },
  {
    name: "Pro",
    price: 0,
    maxBranches: null,
    maxProducts: null,
    maxStaff: null,
    maxLanguages: null,
    features: { appearance: "FULL", stats: "DETAILED", customDomain: true },
  },
];

// ---------- Yardımcılar ----------

function seedPassword() {
  const password = process.env.SEED_PASSWORD;
  if (password) return password;
  if (isProduction) throw new Error("SEED_PASSWORD tanımlı değil.");
  return "degistir-beni-123";
}

async function upsertUser(input: {
  email: string;
  name: string;
  role: Role;
  businessId?: string;
  permissions?: Permission[];
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;

  const id = randomUUID();
  const password = await hashPassword(seedPassword());
  return db.user.create({
    data: {
      id,
      email: input.email,
      name: input.name,
      role: input.role,
      emailVerified: true,
      businessId: input.businessId,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password,
        },
      },
      permissions: input.permissions
        ? { create: input.permissions.map((permission) => ({ permission })) }
        : undefined,
    },
  });
}

// ---------- Adımlar ----------

async function seedReferenceData() {
  for (const [code, name, en] of ALLERGENS) {
    await db.allergen.upsert({
      where: { code },
      update: { name, translations: { en: { name: en } } },
      create: { code, name, icon: code, translations: { en: { name: en } } },
    });
  }
  for (const [code, name, en] of TAGS) {
    await db.tag.upsert({
      where: { code },
      update: { name, translations: { en: { name: en } } },
      create: { code, name, icon: code, translations: { en: { name: en } } },
    });
  }
  for (const plan of PLANS) {
    await db.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
}

async function seedSuperAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@qrmenu.local";
  await upsertUser({ email, name: "Platform Yöneticisi", role: "SUPER_ADMIN" });
  return email;
}

type SeedProduct = {
  name: string;
  description?: string;
  variants: [name: string | null, price: number][];
  badges?: Badge[];
  allergens?: [code: string, level: AllergenLevel][];
  tags?: string[];
  spiceLevel?: number;
  isAvailable?: boolean;
  ingredients?: string;
  portion?: string;
  prepTime?: number;
};

// Test için örnek menü (tasarım taslaklarındaki "Limon Kafe").
const DEMO_MENU: [category: string, products: SeedProduct[]][] = [
  [
    "Kahveler",
    [
      {
        name: "Latte",
        description: "Çift shot espresso ve buharda ısıtılmış süt.",
        variants: [
          ["Küçük · 250 ml", 8500],
          ["Orta · 350 ml", 9500],
          ["Büyük · 450 ml", 11000],
        ],
        badges: ["POPULAR"],
        allergens: [
          ["milk", "CONTAINS"],
          ["gluten", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
        ingredients: "Espresso, süt",
        prepTime: 5,
      },
      {
        name: "Filtre Kahve",
        description: "Her sabah taze demlenen tek köken çekirdek.",
        variants: [[null, 7000]],
        badges: ["NEW"],
        tags: ["vegan"],
      },
      {
        name: "Türk Kahvesi",
        description: "Közde pişirilir, lokum ile servis edilir.",
        variants: [[null, 6500]],
        badges: ["CHEFS_CHOICE"],
        tags: ["vegan"],
      },
      {
        name: "Mocha",
        description: "Espresso, bitter çikolata sosu ve süt.",
        variants: [
          ["Orta", 10500],
          ["Büyük", 12000],
        ],
        allergens: [
          ["milk", "CONTAINS"],
          ["soy", "CONTAINS"],
        ],
        isAvailable: false,
      },
    ],
  ],
  [
    "Soğuk İçecekler",
    [
      {
        name: "Ev Yapımı Limonata",
        description: "Taze sıkılmış limon ve nane.",
        variants: [[null, 9000]],
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Soğuk Demleme",
        description: "18 saat soğukta demlenmiş kahve.",
        variants: [[null, 9500]],
        tags: ["vegan"],
      },
    ],
  ],
  [
    "Tatlılar",
    [
      {
        name: "San Sebastian Cheesecake",
        description: "Yanık yüzeyli, akışkan kıvamlı cheesecake.",
        variants: [[null, 16000]],
        badges: ["POPULAR"],
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
    ],
  ],
  [
    "Salatalar",
    [
      {
        name: "Akdeniz Salatası",
        description: "Mevsim yeşillikleri, domates, salatalık, zeytin.",
        variants: [[null, 15000]],
        allergens: [["gluten", "MAY_CONTAIN"]],
        tags: ["vegan", "halal"],
      },
      {
        name: "Acılı Ton Balıklı Salata",
        description: "Ton balığı, kırmızı soğan, acı biber.",
        variants: [[null, 18500]],
        allergens: [
          ["fish", "CONTAINS"],
          ["mustard", "CONTAINS"],
        ],
        tags: ["halal"],
        spiceLevel: 2,
      },
    ],
  ],
];

async function seedDemoBusiness() {
  const exists = await db.business.findUnique({
    where: { slug: "limon-kafe" },
  });
  if (exists) return;

  const standard = await db.plan.findUniqueOrThrow({
    where: { name: "Standart" },
  });
  const allergens = new Map(
    (await db.allergen.findMany()).map((a) => [a.code, a.id]),
  );
  const tags = new Map((await db.tag.findMany()).map((t) => [t.code, t.id]));

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(now.getFullYear() + 1);

  const everyDay = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  const business = await db.business.create({
    data: {
      name: "Limon Kafe",
      slug: "limon-kafe",
      subscriptions: {
        create: { planId: standard.id, startsAt: now, endsAt: oneYearLater },
      },
      branches: {
        create: {
          name: "Kadıköy",
          slug: "kadikoy",
          address: "[Adres]",
          wifi: "[Wi-Fi şifresi]",
          socials: { instagram: "[instagram-hesabı]" },
          openingHours: Object.fromEntries(
            everyDay.map((day) => [day, [["08:00", "23:00"]]]),
          ),
          languages: ["tr", "en"],
          categories: {
            create: DEMO_MENU.map(([name, products], categoryIndex) => ({
              name,
              sortOrder: categoryIndex,
              products: {
                create: products.map((p, productIndex) => ({
                  name: p.name,
                  description: p.description,
                  badges: p.badges ?? [],
                  spiceLevel: p.spiceLevel ?? 0,
                  isAvailable: p.isAvailable ?? true,
                  ingredients: p.ingredients,
                  portion: p.portion,
                  prepTime: p.prepTime,
                  sortOrder: productIndex,
                  variants: {
                    create: p.variants.map(([name, price], i) => ({
                      name,
                      price,
                      sortOrder: i,
                    })),
                  },
                  allergens: {
                    create: (p.allergens ?? []).map(([code, level]) => ({
                      allergenId: allergens.get(code)!,
                      level,
                    })),
                  },
                  tags: {
                    create: (p.tags ?? []).map((code) => ({
                      tagId: tags.get(code)!,
                    })),
                  },
                })),
              },
            })),
          },
        },
      },
    },
  });

  await upsertUser({
    email: "sahip@limonkafe.test",
    name: "Ayşe Yılmaz",
    role: "OWNER",
    businessId: business.id,
  });
  await upsertUser({
    email: "calisan@limonkafe.test",
    name: "Can Öztürk",
    role: "STAFF",
    businessId: business.id,
    permissions: ["PRODUCT_TOGGLE_AVAILABILITY"],
  });
}

async function main() {
  await seedReferenceData();
  const adminEmail = await seedSuperAdmin();
  console.log(`✓ 14 alerjen, ${TAGS.length} etiket, ${PLANS.length} paket`);
  console.log(`✓ Süper admin: ${adminEmail}`);

  if (!isProduction) {
    await seedDemoBusiness();
    console.log("✓ Örnek işletme: /limon-kafe/kadikoy");
    console.log(
      "  sahip@limonkafe.test (sahip), calisan@limonkafe.test (çalışan)",
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
