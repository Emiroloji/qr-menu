// Tanıtım için bir işletmeyi dolu bir kafe menüsüyle doldurur: kategoriler, fotoğraflı
// ürünler, İngilizce çeviriler, alerjenler, kampanyalar, günün önerisi ve son 90 günün
// örnek istatistikleri. Müşteriye boş hesap göstermemek içindir.
//
// Kullanım:
//   npx tsx scripts/demo-menu.ts --business <slug> [--name "Demo Kafe"] [--owner-email e-posta]
//
// - İşletme varsa ilk şubesi doldurulur (şube yoksa "Merkez" açılır). Kullanıcılara dokunulmaz.
// - İşletme yoksa Pro paketle 1 yıllık abonelik açılır; --owner-email verilirse sahip hesabı
//   DEMO_PASSWORD şifresiyle oluşturulur.
// - Şubede zaten kategori varsa hiçbir şey yapmaz (gerçek menünün üzerine yazılmaz).
// - Fotoğraflar Unsplash'ten (ücretsiz lisans) indirilir, panelle aynı biçimde
//   (400/800/1200 px WebP + bulanık önizleme) R2'ye yüklenir.
// - Menü önbelleği betikten temizlenemez: en geç 1 saatte yenilenir; hemen görmek için
//   panelde herhangi bir ürünü kaydetmek yeterlidir.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import sharp from "sharp";
import {
  PrismaClient,
  type AllergenLevel,
  type Badge,
} from "../lib/generated/prisma/client";
import { parseDateInput, toDateInputValue } from "../lib/format";
import { PRODUCT_IMAGE_SIZES } from "../lib/product-image";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// ---------- Depolama (lib/storage.ts ve lib/images.ts ile aynı biçim) ----------

const s3 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: Boolean(process.env.R2_ENDPOINT),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});
const publicBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

async function upload(key: string, body: Buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${publicBase}/${key}`;
}

const photoCache = new Map<string, Buffer>();
async function photo(id: string) {
  const cached = photoCache.get(id);
  if (cached) return cached;
  const response = await fetch(
    `https://images.unsplash.com/photo-${id}?w=1600&q=85&fm=jpg&fit=crop&ar=4:3`,
  );
  if (!response.ok) throw new Error(`Fotoğraf indirilemedi: ${id}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  photoCache.set(id, buffer);
  return buffer;
}

/** Ürün ve kampanya görseli: 400/800/1200 px WebP + bulanık önizleme. */
async function uploadSizedImage(folder: string, photoId: string) {
  const base = sharp(await photo(photoId)).rotate();
  const key = `${folder}/${randomUUID()}`;
  await Promise.all(
    PRODUCT_IMAGE_SIZES.map(async (width) =>
      upload(
        `${key}-${width}.webp`,
        await base
          .clone()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      ),
    ),
  );
  const blur = await base
    .clone()
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();
  return {
    url: `${publicBase}/${key}`,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

// ---------- Menü ----------

type DemoProduct = {
  name: string;
  en: string;
  description: string;
  descriptionEn: string;
  variants: [name: string | null, nameEn: string | null, lira: number][];
  photo?: string;
  badges?: Badge[];
  allergens?: [code: string, level: AllergenLevel][];
  tags?: string[];
  spiceLevel?: number;
  prepTime?: number;
  portion?: string;
  origin?: string;
  ingredients?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    salt: number;
  };
  isAvailable?: boolean;
  isFeatured?: boolean;
};

type DemoCategory = {
  name: string;
  en: string;
  description?: string;
  descriptionEn?: string;
  products: DemoProduct[];
};

const SIZES: DemoProduct["variants"] = [
  ["Küçük · 250 ml", "Small · 250 ml", 0],
  ["Orta · 350 ml", "Medium · 350 ml", 0],
  ["Büyük · 450 ml", "Large · 450 ml", 0],
];
const sized = (...prices: number[]): DemoProduct["variants"] =>
  prices.map((price, i) => [SIZES[i][0], SIZES[i][1], price]);
const single = (lira: number): DemoProduct["variants"] => [[null, null, lira]];

const MENU: DemoCategory[] = [
  {
    name: "Kahvaltı",
    en: "Breakfast",
    description: "Her gün 08:00'den itibaren.",
    descriptionEn: "Every day from 8 am.",
    products: [
      {
        name: "Serpme Kahvaltı",
        en: "Turkish Breakfast Spread",
        description:
          "Peynir çeşitleri, zeytin, bal-kaymak, reçeller, sahanda yumurta, sınırsız çay.",
        descriptionEn:
          "Cheeses, olives, honey and clotted cream, jams, fried eggs and bottomless tea.",
        variants: [
          ["2 kişilik", "For 2", 850],
          ["4 kişilik", "For 4", 1600],
        ],
        photo: "1504754524776-8f4f37790ca0",
        badges: ["POPULAR"],
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
          ["tree_nuts", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
        prepTime: 15,
        isFeatured: true,
      },
      {
        name: "Kahvaltı Tabağı",
        en: "Breakfast Plate",
        description:
          "Sahanda yumurta, ızgara domates, sucuk, kızarmış ekmek ve peynir.",
        descriptionEn:
          "Fried eggs, grilled tomatoes, Turkish sausage, toast and cheese.",
        variants: single(380),
        photo: "1533089860892-a7c6f0a88666",
        allergens: [
          ["eggs", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["gluten", "CONTAINS"],
        ],
        tags: ["halal"],
        prepTime: 12,
      },
      {
        name: "Menemen",
        en: "Menemen",
        description: "Domates, biber ve yumurta; tereyağında, bakır sahanda.",
        descriptionEn:
          "Eggs scrambled with tomatoes and peppers in butter, served in a copper pan.",
        variants: single(220),
        photo: "1590412200988-a436970781fa",
        allergens: [
          ["eggs", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["vegetarian", "gluten_free"],
        spiceLevel: 1,
        prepTime: 10,
      },
      {
        name: "Avokadolu Yumurtalı Tost",
        en: "Avocado Toast with Egg",
        description:
          "Ekşi maya ekmek, ezilmiş avokado, sahanda yumurta, pul biber.",
        descriptionEn:
          "Sourdough, smashed avocado, fried egg and chili flakes.",
        variants: single(290),
        photo: "1525351484163-7529414344d8",
        badges: ["NEW"],
        allergens: [
          ["gluten", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["sesame", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
        spiceLevel: 1,
        nutrition: {
          calories: 420,
          protein: 15,
          carbs: 34,
          fat: 24,
          sugar: 3,
          salt: 1.1,
        },
      },
      {
        name: "Pankek",
        en: "Pancakes",
        description: "Üç kat pankek, akçaağaç şurubu, muz ve mevsim meyveleri.",
        descriptionEn:
          "Three pancakes with maple syrup, banana and fresh fruit.",
        variants: single(260),
        photo: "1567620905732-2d1ec7ab7445",
        allergens: [
          ["gluten", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["vegetarian"],
        prepTime: 12,
      },
      {
        name: "French Toast",
        en: "French Toast",
        description: "Brioche ekmek, yaban mersini, muz ve pudra şekeri.",
        descriptionEn: "Brioche with blueberries, banana and powdered sugar.",
        variants: single(280),
        photo: "1484723091739-30a097e8f929",
        badges: ["CHEFS_CHOICE"],
        allergens: [
          ["gluten", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Tereyağlı Kruvasan",
        en: "Butter Croissant",
        description: "Her sabah fırından çıkan, katmerli Fransız kruvasanı.",
        descriptionEn: "Flaky French croissant, baked fresh every morning.",
        variants: single(120),
        photo: "1555507036-ab1f4038808a",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
    ],
  },
  {
    name: "Sıcak Kahveler",
    en: "Hot Coffee",
    products: [
      {
        name: "Espresso",
        en: "Espresso",
        description: "Çekirdeklerimiz haftalık olarak kavrulur.",
        descriptionEn: "Our beans are roasted weekly.",
        variants: [
          ["Tek", "Single", 90],
          ["Duble", "Double", 110],
        ],
        photo: "1510591509098-f4fdc6d0ff04",
        tags: ["vegan", "gluten_free"],
        origin: "Brezilya, Kolombiya",
      },
      {
        name: "Americano",
        en: "Americano",
        description: "Espresso ve sıcak su.",
        descriptionEn: "Espresso and hot water.",
        variants: sized(110, 125, 140),
        photo: "1551030173-122aabc4489c",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Latte",
        en: "Latte",
        description: "Çift shot espresso ve buharda ısıtılmış süt.",
        descriptionEn: "Double shot espresso with steamed milk.",
        variants: sized(135, 150, 165),
        photo: "1541167760496-1628856ab772",
        badges: ["POPULAR"],
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
        ingredients: "Espresso, süt",
        nutrition: {
          calories: 190,
          protein: 10,
          carbs: 15,
          fat: 7,
          sugar: 14,
          salt: 0.3,
        },
        isFeatured: true,
      },
      {
        name: "Cappuccino",
        en: "Cappuccino",
        description: "Espresso, süt ve bol süt köpüğü.",
        descriptionEn: "Espresso, milk and a thick layer of foam.",
        variants: sized(135, 150, 165),
        photo: "1495474472287-4d71bcdd2085",
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
      },
      {
        name: "Flat White",
        en: "Flat White",
        description: "Ristretto ve ince dokulu süt; daha yoğun bir latte.",
        descriptionEn: "Ristretto with silky microfoam; a stronger latte.",
        variants: single(145),
        photo: "1509042239860-f550ce710b93",
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
      },
      {
        name: "Mocha",
        en: "Mocha",
        description: "Espresso, bitter çikolata sosu ve süt.",
        descriptionEn: "Espresso, dark chocolate sauce and milk.",
        variants: sized(150, 165, 180),
        photo: "1534778101976-62847782c213",
        allergens: [
          ["milk", "CONTAINS"],
          ["soy", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Türk Kahvesi",
        en: "Turkish Coffee",
        description: "Közde pişirilir, lokum ile servis edilir.",
        descriptionEn: "Slow-cooked on hot sand, served with Turkish delight.",
        variants: [
          ["Tek", "Single", 90],
          ["Duble", "Double", 120],
        ],
        photo: "1514432324607-a09d9b4aefdd",
        badges: ["CHEFS_CHOICE"],
        tags: ["vegan"],
        prepTime: 7,
      },
      {
        name: "Filtre Kahve",
        en: "Filter Coffee",
        description: "Her sabah taze demlenen tek köken çekirdek.",
        descriptionEn: "Single-origin beans, freshly brewed every morning.",
        variants: single(110),
        photo: "1442512595331-e89e73853f31",
        tags: ["vegan", "gluten_free"],
        origin: "Etiyopya",
      },
    ],
  },
  {
    name: "Soğuk Kahveler",
    en: "Iced Coffee",
    products: [
      {
        name: "Ice Latte",
        en: "Iced Latte",
        description: "Buz, soğuk süt ve çift shot espresso.",
        descriptionEn: "Ice, cold milk and a double shot of espresso.",
        variants: sized(150, 165, 180),
        photo: "1517701604599-bb29b565090c",
        badges: ["POPULAR"],
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
      },
      {
        name: "Soğuk Demleme",
        en: "Cold Brew",
        description: "18 saat soğukta demlenmiş, yumuşak içimli kahve.",
        descriptionEn: "Steeped cold for 18 hours; smooth and low in acidity.",
        variants: single(145),
        photo: "1461023058943-07fcbe16d735",
        badges: ["NEW"],
        tags: ["vegan", "gluten_free"],
        isFeatured: true,
      },
      {
        name: "Oreolu Milkshake",
        en: "Oreo Milkshake",
        description: "Vanilyalı dondurma, Oreo bisküvi ve krem şanti.",
        descriptionEn: "Vanilla ice cream, Oreo cookies and whipped cream.",
        variants: single(175),
        photo: "1572490122747-3968b75cc699",
        allergens: [
          ["milk", "CONTAINS"],
          ["gluten", "CONTAINS"],
          ["soy", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
    ],
  },
  {
    name: "Çay ve Sıcak İçecekler",
    en: "Tea & Hot Drinks",
    products: [
      {
        name: "Çay",
        en: "Turkish Tea",
        description: "Rize çayı, demlikte.",
        descriptionEn: "Black tea from Rize, brewed the Turkish way.",
        variants: [
          ["Bardak", "Glass", 30],
          ["Fincan", "Cup", 50],
        ],
        photo: "1571934811356-5cc061b6821f",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Bitki Çayı",
        en: "Herbal Tea",
        description: "Ihlamur, adaçayı, kuşburnu veya papatya.",
        descriptionEn: "Linden, sage, rosehip or chamomile.",
        variants: single(90),
        photo: "1576092768241-dec231879fc3",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Sıcak Çikolata",
        en: "Hot Chocolate",
        description: "Belçika çikolatası ve süt, marshmallow ile.",
        descriptionEn: "Belgian chocolate and milk, topped with marshmallows.",
        variants: single(140),
        photo: "1542990253-0d0f5be5f0ed",
        allergens: [
          ["milk", "CONTAINS"],
          ["soy", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Salep",
        en: "Salep",
        description: "Tarçınlı, geleneksel kış içeceği.",
        descriptionEn: "Traditional winter drink with cinnamon.",
        variants: single(130),
        photo: "1544787219-7f47ccb76574",
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
        isAvailable: false,
      },
    ],
  },
  {
    name: "Soğuk İçecekler",
    en: "Cold Drinks",
    products: [
      {
        name: "Ev Yapımı Limonata",
        en: "Homemade Lemonade",
        description: "Taze sıkılmış limon, biberiye ve az şeker.",
        descriptionEn: "Freshly squeezed lemons, rosemary and a little sugar.",
        variants: single(110),
        photo: "1523371054106-bbf80586c38c",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Çilekli Limonata",
        en: "Strawberry Lemonade",
        description: "Limonata, taze çilek ve nane.",
        descriptionEn: "Lemonade with fresh strawberries and mint.",
        variants: single(125),
        photo: "1497534446932-c925b458314e",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Taze Portakal Suyu",
        en: "Fresh Orange Juice",
        description: "Siparişle sıkılır.",
        descriptionEn: "Squeezed to order.",
        variants: single(120),
        photo: "1600271886742-f049cd451bba",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Mango Smoothie",
        en: "Mango Smoothie",
        description: "Mango, muz ve yoğurt.",
        descriptionEn: "Mango, banana and yoghurt.",
        variants: single(160),
        photo: "1534353473418-4cfa6c56fd38",
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
      },
      {
        name: "Ice Tea",
        en: "Iced Tea",
        description: "Ev yapımı, limonlu.",
        descriptionEn: "Homemade, with lime.",
        variants: single(110),
        photo: "1556679343-c7306c1976bc",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Su",
        en: "Water",
        description: "",
        descriptionEn: "",
        variants: single(25),
        photo: "1548839140-29a749e1cf4d",
        tags: ["vegan", "gluten_free"],
      },
    ],
  },
  {
    name: "Tost ve Sandviçler",
    en: "Toasties & Sandwiches",
    products: [
      {
        name: "Kaşarlı Tost",
        en: "Cheese Toastie",
        description: "Köy ekmeğinde bol kaşar; turşu ve cips ile.",
        descriptionEn:
          "Plenty of kashar cheese on village bread; with pickles and chips.",
        variants: single(180),
        photo: "1528735602780-2552fd46c7af",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Karışık Tost",
        en: "Mixed Toastie",
        description: "Kaşar, sucuk ve domates.",
        descriptionEn: "Kashar cheese, Turkish sausage and tomato.",
        variants: single(210),
        photo: "1481070414801-51fd732d7184",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["halal"],
      },
      {
        name: "Tavuklu Wrap",
        en: "Chicken Wrap",
        description:
          "Izgara tavuk, marul, cheddar ve ranch sos; patates kızartmasıyla.",
        descriptionEn:
          "Grilled chicken, lettuce, cheddar and ranch; with fries.",
        variants: single(290),
        photo: "1626700051175-6818013e1d4f",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["mustard", "MAY_CONTAIN"],
        ],
        tags: ["halal"],
        prepTime: 12,
      },
    ],
  },
  {
    name: "Burgerler",
    en: "Burgers",
    description: "Tüm burgerler patates kızartması ile servis edilir.",
    descriptionEn: "All burgers are served with fries.",
    products: [
      {
        name: "Klasik Burger",
        en: "Classic Burger",
        description: "150 g dana köfte, marul, domates, turşu, özel sos.",
        descriptionEn:
          "150 g beef patty, lettuce, tomato, pickles, house sauce.",
        variants: single(360),
        photo: "1571091718767-18b5b1457add",
        badges: ["POPULAR"],
        allergens: [
          ["gluten", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["mustard", "CONTAINS"],
          ["sesame", "CONTAINS"],
        ],
        tags: ["halal"],
        portion: "150 g",
        prepTime: 15,
        nutrition: {
          calories: 780,
          protein: 38,
          carbs: 62,
          fat: 41,
          sugar: 9,
          salt: 2.4,
        },
      },
      {
        name: "Cheeseburger",
        en: "Cheeseburger",
        description: "150 g dana köfte, çift cheddar, karamelize soğan.",
        descriptionEn: "150 g beef patty, double cheddar, caramelised onions.",
        variants: single(390),
        photo: "1568901346375-23c9450c58cd",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["sesame", "CONTAINS"],
        ],
        tags: ["halal"],
        portion: "150 g",
        prepTime: 15,
      },
      {
        name: "Acılı Burger",
        en: "Spicy Burger",
        description: "Dana köfte, jalapeño, acı mayonez ve cheddar.",
        descriptionEn: "Beef patty, jalapeños, spicy mayo and cheddar.",
        variants: [
          ["Tek köfte", "Single patty", 380],
          ["Çift köfte", "Double patty", 480],
        ],
        photo: "1586190848861-99aa4a171e90",
        badges: ["NEW"],
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["sesame", "CONTAINS"],
        ],
        tags: ["halal"],
        spiceLevel: 3,
        prepTime: 15,
      },
    ],
  },
  {
    name: "Makarna ve Pizza",
    en: "Pasta & Pizza",
    products: [
      {
        name: "Penne Arrabbiata",
        en: "Penne Arrabbiata",
        description: "Sarımsaklı, acılı domates sosu ve taze fesleğen.",
        descriptionEn: "Garlic and chili tomato sauce with fresh basil.",
        variants: single(310),
        photo: "1621996346565-e3dbc646d9a9",
        allergens: [["gluten", "CONTAINS"]],
        tags: ["vegan"],
        spiceLevel: 2,
        prepTime: 15,
      },
      {
        name: "Fettuccine Alfredo",
        en: "Fettuccine Alfredo",
        description: "Kremalı parmesan sos, mantar ve tavuk.",
        descriptionEn: "Creamy parmesan sauce with mushrooms and chicken.",
        variants: single(340),
        photo: "1645112411341-6c4fd023714a",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
        ],
        tags: ["halal"],
        prepTime: 15,
      },
      {
        name: "Margherita Pizza",
        en: "Margherita Pizza",
        description: "İnce hamur, domates sosu, mozzarella ve fesleğen.",
        descriptionEn: "Thin crust, tomato sauce, mozzarella and basil.",
        variants: [
          ["Orta · 26 cm", "Medium · 26 cm", 320],
          ["Büyük · 32 cm", "Large · 32 cm", 390],
        ],
        photo: "1513104890138-7c749659a591",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
        ],
        tags: ["vegetarian"],
        prepTime: 18,
      },
    ],
  },
  {
    name: "Salatalar",
    en: "Salads",
    products: [
      {
        name: "Akdeniz Salatası",
        en: "Mediterranean Salad",
        description:
          "Mevsim yeşillikleri, domates, salatalık, zeytin, nar ekşisi.",
        descriptionEn:
          "Seasonal greens, tomato, cucumber, olives and pomegranate molasses.",
        variants: single(260),
        photo: "1540189549336-e6e99c3679fe",
        tags: ["vegan", "gluten_free"],
      },
      {
        name: "Izgara Tavuklu Salata",
        en: "Grilled Chicken Salad",
        description: "Izgara tavuk, haşlanmış yumurta, mısır, kırmızı lahana.",
        descriptionEn:
          "Grilled chicken, boiled egg, sweetcorn and red cabbage.",
        variants: single(320),
        photo: "1546069901-ba9599a7e63c",
        allergens: [
          ["eggs", "CONTAINS"],
          ["mustard", "MAY_CONTAIN"],
        ],
        tags: ["halal", "gluten_free"],
        nutrition: {
          calories: 450,
          protein: 36,
          carbs: 18,
          fat: 24,
          sugar: 6,
          salt: 1.4,
        },
      },
      {
        name: "Avokadolu Bowl",
        en: "Avocado Bowl",
        description: "Avokado, nohut, fırın tatlı patates, kinoa ve tahin sos.",
        descriptionEn:
          "Avocado, chickpeas, roasted sweet potato, quinoa and tahini.",
        variants: single(330),
        photo: "1512621776951-a57141f2eefd",
        badges: ["CHEFS_CHOICE"],
        allergens: [["sesame", "CONTAINS"]],
        tags: ["vegan", "gluten_free"],
      },
    ],
  },
  {
    name: "Tatlılar",
    en: "Desserts",
    products: [
      {
        name: "San Sebastian Cheesecake",
        en: "San Sebastian Cheesecake",
        description: "Yanık yüzeyli, akışkan kıvamlı cheesecake.",
        descriptionEn: "Burnt Basque cheesecake with a creamy centre.",
        variants: single(230),
        photo: "1524351199678-941a58a3df50",
        badges: ["POPULAR"],
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Tiramisu",
        en: "Tiramisu",
        description: "Mascarpone, espresso ve kakao.",
        descriptionEn: "Mascarpone, espresso and cocoa.",
        variants: single(210),
        photo: "1571877227200-a0d98ea607e9",
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
        ],
        tags: ["vegetarian"],
        isFeatured: true,
      },
      {
        name: "Çikolatalı Pasta",
        en: "Chocolate Cake",
        description: "Üç katlı, bitter çikolatalı ganajlı.",
        descriptionEn: "Three layers with dark chocolate ganache.",
        variants: single(200),
        photo: "1578985545062-69928b1d9587",
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
          ["tree_nuts", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Frambuazlı Pasta",
        en: "Raspberry Cake",
        description: "Vanilyalı pandispanya, frambuaz ve hafif krema.",
        descriptionEn: "Vanilla sponge with raspberries and light cream.",
        variants: single(210),
        photo: "1565958011703-44f9829ba187",
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Brownie",
        en: "Brownie",
        description: "Sıcak servis edilir; isterseniz dondurmayla.",
        descriptionEn: "Served warm; with ice cream if you like.",
        variants: [
          ["Sade", "Plain", 170],
          ["Dondurmalı", "With ice cream", 210],
        ],
        photo: "1606313564200-e75d5e30476c",
        allergens: [
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["gluten", "CONTAINS"],
          ["tree_nuts", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Çilekli Muhallebi",
        en: "Strawberry Milk Pudding",
        description: "Ev yapımı muhallebi ve taze çilek.",
        descriptionEn: "Homemade milk pudding with fresh strawberries.",
        variants: single(150),
        photo: "1488477181946-6428a0291777",
        allergens: [["milk", "CONTAINS"]],
        tags: ["vegetarian", "gluten_free"],
      },
      {
        name: "Donut",
        en: "Donut",
        description: "Çikolata veya renkli şekerli.",
        descriptionEn: "Chocolate glazed or with sprinkles.",
        variants: single(90),
        photo: "1551024601-bec78aea704b",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
          ["soy", "MAY_CONTAIN"],
        ],
        tags: ["vegetarian"],
      },
      {
        name: "Çikolatalı Kurabiye",
        en: "Chocolate Chip Cookie",
        description: "Günlük taze, iri damla çikolatalı.",
        descriptionEn: "Baked daily, with big chocolate chunks.",
        variants: single(75),
        photo: "1558961363-fa8fdf82db35",
        allergens: [
          ["gluten", "CONTAINS"],
          ["milk", "CONTAINS"],
          ["eggs", "CONTAINS"],
        ],
        tags: ["vegetarian"],
      },
    ],
  },
];

const COVER_PHOTO = "1509042239860-f550ce710b93";
const CAMPAIGNS = [
  {
    title: "Hafta içi 15:00–17:00 tatlılarda %20 indirim",
    titleEn: "20% off desserts on weekdays, 3–5 pm",
    description: "Kahvenizin yanına bir dilim pasta.",
    descriptionEn: "A slice of cake with your coffee.",
    photo: "1565958011703-44f9829ba187",
  },
  {
    title: "Hafta sonu serpme kahvaltı",
    titleEn: "Weekend breakfast spread",
    description: "Cumartesi ve pazar 09:00–14:00, sınırsız çay ile.",
    descriptionEn: "Saturday and Sunday 9 am–2 pm, with bottomless tea.",
    photo: "1504754524776-8f4f37790ca0",
  },
];
const DAILY_SPECIALS = [
  "French Toast",
  "Tiramisu",
  "Avokadolu Bowl",
  "San Sebastian Cheesecake",
  "Pankek",
  "Mango Smoothie",
  "Frambuazlı Pasta",
];

// ---------- Adımlar ----------

const DAY = 24 * 60 * 60 * 1000;
const everyDay = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

async function findOrCreateBusiness(slug: string, name: string) {
  const existing = await db.business.findFirst({
    where: { slug, deletedAt: null },
    include: {
      subscriptions: {
        orderBy: { endsAt: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });
  if (existing) {
    console.log(`• Mevcut işletme: ${existing.name}`);
    return {
      business: existing,
      plan: existing.subscriptions[0]?.plan ?? null,
    };
  }

  const plan = await db.plan.findUniqueOrThrow({ where: { name: "Pro" } });
  const now = new Date();
  const business = await db.business.create({
    data: {
      name,
      slug,
      subscriptions: {
        create: {
          planId: plan.id,
          startsAt: parseDateInput(toDateInputValue(now), "start"),
          endsAt: parseDateInput(
            toDateInputValue(new Date(now.getTime() + 365 * DAY)),
            "end",
          ),
        },
      },
    },
  });
  console.log(`• Yeni işletme: ${name} (Pro, 1 yıl)`);
  return { business, plan };
}

async function createOwner(businessId: string, email: string) {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 8)
    throw new Error(
      "Sahip hesabı için DEMO_PASSWORD (en az 8 karakter) gerekli.",
    );
  if (await db.user.findUnique({ where: { email } }))
    throw new Error(`${email} zaten kayıtlı.`);
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: "Demo Sahip",
      role: "OWNER",
      emailVerified: true,
      businessId,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
  console.log(`• Sahip hesabı: ${email}`);
}

async function prepareBranch(businessId: string, languages: string[]) {
  const info = {
    address: "Caferağa Mah. Moda Cad. No: 12, Kadıköy / İstanbul",
    phone: "0216 000 00 00",
    wifi: "kafe2026",
    socials: {
      instagram: "https://instagram.com/demokafe",
      website: "https://demokafe.com",
    },
    openingHours: Object.fromEntries(
      everyDay.map((day) => [
        day,
        [
          day === "sat" || day === "sun"
            ? ["09:00", "00:00"]
            : ["08:00", "23:00"],
        ],
      ]),
    ),
  };

  const branch = await db.branch.findFirst({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!branch) {
    console.log("• Şube açıldı: Merkez");
    return db.branch.create({
      data: { businessId, name: "Merkez", slug: "merkez", languages, ...info },
    });
  }

  const categories = await db.category.count({
    where: { branchId: branch.id, deletedAt: null },
  });
  if (categories > 0)
    throw new Error(
      `"${branch.name}" şubesinde zaten ${categories} kategori var; gerçek menünün üzerine yazılmaz.`,
    );

  // Yalnızca boş alanlar doldurulur.
  console.log(`• Mevcut şube dolduruluyor: ${branch.name}`);
  return db.branch.update({
    where: { id: branch.id },
    data: {
      languages: Array.from(new Set([...branch.languages, ...languages])),
      address: branch.address ?? info.address,
      phone: branch.phone ?? info.phone,
      wifi: branch.wifi ?? info.wifi,
      socials:
        Object.keys(branch.socials as object).length > 0
          ? undefined
          : info.socials,
      openingHours:
        Object.keys(branch.openingHours as object).length > 0
          ? undefined
          : info.openingHours,
    },
  });
}

async function createMenu(businessId: string, branchId: string) {
  const allergens = new Map(
    (await db.allergen.findMany()).map((a) => [a.code, a.id]),
  );
  const tags = new Map((await db.tag.findMany()).map((t) => [t.code, t.id]));
  const products = new Map<string, string>();

  for (const [categoryIndex, category] of MENU.entries()) {
    const created = await db.category.create({
      data: {
        branchId,
        name: category.name,
        description: category.description,
        sortOrder: categoryIndex,
        translations: {
          en: {
            name: category.en,
            ...(category.descriptionEn && {
              description: category.descriptionEn,
            }),
          },
        },
      },
    });

    for (const [productIndex, p] of category.products.entries()) {
      const product = await db.product.create({
        data: {
          categoryId: created.id,
          name: p.name,
          description: p.description || null,
          ingredients: p.ingredients,
          portion: p.portion,
          spiceLevel: p.spiceLevel ?? 0,
          prepTime: p.prepTime,
          origin: p.origin,
          isAvailable: p.isAvailable ?? true,
          isFeatured: p.isFeatured ?? false,
          badges: p.badges ?? [],
          sortOrder: productIndex,
          translations: {
            en: {
              name: p.en,
              ...(p.descriptionEn && { description: p.descriptionEn }),
            },
          },
          variants: {
            create: p.variants.map(([name, nameEn, lira], i) => ({
              name,
              price: lira * 100,
              sortOrder: i,
              translations: nameEn ? { en: { name: nameEn } } : {},
            })),
          },
          nutrition: p.nutrition ? { create: p.nutrition } : undefined,
          allergens: {
            create: (p.allergens ?? []).map(([code, level]) => ({
              allergenId: allergens.get(code)!,
              level,
            })),
          },
          tags: {
            create: (p.tags ?? []).map((code) => ({ tagId: tags.get(code)! })),
          },
        },
      });
      products.set(p.name, product.id);

      if (p.photo) {
        const image = await uploadSizedImage(
          `business/${businessId}/products/${product.id}`,
          p.photo,
        );
        await db.productImage.create({
          data: { productId: product.id, ...image, sortOrder: 0 },
        });
      }
    }
    console.log(`  ✓ ${category.name} (${category.products.length} ürün)`);
  }
  return products;
}

async function createPromotions(
  businessId: string,
  branchId: string,
  products: Map<string, string>,
) {
  const now = new Date();
  for (const c of CAMPAIGNS) {
    const campaign = await db.campaign.create({
      data: {
        branchId,
        title: c.title,
        description: c.description,
        startsAt: parseDateInput(toDateInputValue(now), "start"),
        endsAt: parseDateInput(
          toDateInputValue(new Date(now.getTime() + 60 * DAY)),
          "end",
        ),
        translations: { en: { name: c.titleEn, description: c.descriptionEn } },
      },
    });
    const image = await uploadSizedImage(
      `business/${businessId}/campaigns/${campaign.id}`,
      c.photo,
    );
    await db.campaign.update({
      where: { id: campaign.id },
      data: { imageUrl: image.url, blurDataUrl: image.blurDataUrl },
    });
  }

  // Bugünden başlayarak bir haftalık günün önerisi.
  for (const [i, name] of DAILY_SPECIALS.entries()) {
    const day = toDateInputValue(new Date(now.getTime() + i * DAY));
    await db.dailySpecial.create({
      data: {
        branchId,
        productId: products.get(name)!,
        date: new Date(`${day}T00:00:00Z`),
      },
    });
  }
  console.log(`  ✓ ${CAMPAIGNS.length} kampanya, 7 günlük günün önerisi`);
}

/** Son 90 günün örnek tarama ve ürün açılışı kayıtları (istatistik ekranı boş görünmesin). */
async function createStats(
  branchId: string,
  products: Map<string, string>,
  languages: string[],
) {
  // Saat başına ağırlık (Türkiye saati): sabah kahvaltı, öğle ve akşam yoğunluğu.
  const hourWeights = [
    0, 0, 0, 0, 0, 0, 0, 1, 4, 7, 6, 4, 5, 6, 4, 4, 5, 6, 7, 7, 6, 4, 2, 1,
  ];
  const pick = <T>(items: T[], weights: number[]) => {
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (const [i, w] of weights.entries()) if ((r -= w) < 0) return items[i];
    return items[items.length - 1];
  };
  const hours = hourWeights.map((_, h) => h);
  const langs = languages.includes("en") ? ["tr", "en", "de", "ru"] : ["tr"];
  const langWeights = [72, 18, 6, 4].slice(0, langs.length);
  const productIds = [...products.values()];
  // Popüler ürünler daha sık açılır.
  const productWeights = [...products.keys()].map((name) =>
    MENU.flatMap((c) => c.products)
      .find((p) => p.name === name)
      ?.badges?.includes("POPULAR")
      ? 5
      : 1 + Math.random() * 2,
  );

  const scans: {
    branchId: string;
    createdAt: Date;
    language: string;
    device: string;
  }[] = [];
  const views: { branchId: string; productId: string; createdAt: Date }[] = [];
  const today = toDateInputValue(new Date());
  for (let d = 89; d >= 0; d--) {
    const day = toDateInputValue(new Date(Date.now() - d * DAY));
    const weekday = new Date(`${day}T12:00:00+03:00`).getUTCDay();
    const base = weekday === 0 || weekday === 6 ? 95 : 60;
    const count = Math.round(
      base * (0.75 + Math.random() * 0.5) * (1 + (89 - d) / 180),
    );
    for (let i = 0; i < count; i++) {
      const hour = pick(hours, hourWeights);
      const createdAt = parseDateInput(day, "start");
      createdAt.setTime(
        createdAt.getTime() + hour * 3600_000 + Math.random() * 3600_000,
      );
      if (day === today && createdAt > new Date()) continue;
      scans.push({
        branchId,
        createdAt,
        language: pick(langs, langWeights),
        device: pick(["mobile", "tablet", "desktop"], [92, 5, 3]),
      });
      const opened = Math.floor(Math.random() * 3);
      for (let v = 0; v < opened; v++)
        views.push({
          branchId,
          productId: pick(productIds, productWeights),
          createdAt: new Date(createdAt.getTime() + (v + 1) * 20_000),
        });
    }
  }
  await db.scanLog.createMany({ data: scans });
  await db.productView.createMany({ data: views });
  console.log(
    `  ✓ ${scans.length} tarama, ${views.length} ürün açılışı (90 gün)`,
  );
}

async function main() {
  const { values } = parseArgs({
    options: {
      business: { type: "string" },
      name: { type: "string", default: "Demo Kafe" },
      "owner-email": { type: "string" },
    },
  });
  if (!values.business) throw new Error("--business <slug> gerekli.");
  if (!publicBase || !process.env.R2_BUCKET)
    throw new Error("R2_PUBLIC_URL ve R2_BUCKET tanımlı olmalı.");

  const { business, plan } = await findOrCreateBusiness(
    values.business,
    values.name,
  );
  if (values["owner-email"])
    await createOwner(business.id, values["owner-email"]);

  const maxLanguages = plan ? plan.maxLanguages : 1;
  const languages =
    maxLanguages === null || maxLanguages >= 2 ? ["tr", "en"] : ["tr"];
  const branch = await prepareBranch(business.id, languages);

  console.log("• Menü ve fotoğraflar yükleniyor…");
  const products = await createMenu(business.id, branch.id);
  await createPromotions(business.id, branch.id, products);
  await createStats(branch.id, products, branch.languages);

  if (!business.coverUrl) {
    const cover = await sharp(await photo(COVER_PHOTO))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const coverUrl = await upload(
      `business/${business.id}/cover-${Date.now()}.webp`,
      cover,
    );
    await db.business.update({
      where: { id: business.id },
      data: { coverUrl },
    });
    console.log("  ✓ Kapak görseli");
  }

  console.log(`\n✓ Hazır: /${business.slug}/${branch.slug}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
