import { z } from "zod";
import { checkbox, id, priceInput } from "@/lib/validations/common";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

const optionalTime = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null)
  .refine((v) => v === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), {
    message: "Saatleri SS:DD biçiminde girin.",
  });

export const categorySchema = z
  .object({
    name: z.string().trim().min(1, "Kategori adı girin.").max(80),
    description: optionalText(300),
    isVisible: checkbox,
    // Saate göre menü (Faz 2.4): ikisi de boşsa kategori gün boyu görünür.
    availableFrom: optionalTime,
    availableTo: optionalTime,
  })
  .refine((c) => (c.availableFrom === null) === (c.availableTo === null), {
    message: "Görünme saatleri için başlangıç ve bitiş saatini birlikte girin.",
  })
  .refine(
    (c) => c.availableFrom === null || c.availableFrom !== c.availableTo,
    { message: "Başlangıç ve bitiş saati aynı olamaz." },
  );

export const BADGES = {
  CHEFS_CHOICE: "Şefin önerisi",
  NEW: "Yeni",
  POPULAR: "Popüler",
} as const;

export const SPICE_LEVELS = [
  "Acı değil",
  "Az acı",
  "Orta acı",
  "Çok acı",
] as const;

/** Boş: null; dolu: 0 veya pozitif sayı. */
const optionalNumber = (options: { int?: boolean; max: number }) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return null;
      const n = Number(value.replace(",", "."));
      if (
        !Number.isFinite(n) ||
        n < 0 ||
        n > options.max ||
        (options.int && !Number.isInteger(n))
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Besin değerlerini ve süreleri geçerli sayı olarak girin.",
        });
        return z.NEVER;
      }
      return n;
    });

export const productSchema = z
  .object({
    categoryId: id,
    name: z.string().trim().min(1, "Ürün adı girin.").max(120),
    description: optionalText(500),
    ingredients: optionalText(500),
    portion: optionalText(60),
    origin: optionalText(80),
    prepTime: optionalNumber({ int: true, max: 600 }),
    spiceLevel: z.coerce.number().int().min(0).max(3).default(0),
    isVisible: checkbox,
    isAvailable: checkbox,
    badges: z.array(z.enum(Object.keys(BADGES) as [keyof typeof BADGES])),
    tagIds: z.array(id),
    allergens: z.array(
      z.object({ allergenId: id, level: z.enum(["CONTAINS", "MAY_CONTAIN"]) }),
    ),
    variants: z
      .array(z.object({ name: optionalText(40), price: priceInput }))
      .min(1, "En az bir fiyat girin.")
      .max(10, "En fazla 10 boy eklenebilir."),
    nutrition: z.object({
      calories: optionalNumber({ int: true, max: 10000 }),
      protein: optionalNumber({ max: 1000 }),
      carbs: optionalNumber({ max: 1000 }),
      fat: optionalNumber({ max: 1000 }),
      sugar: optionalNumber({ max: 1000 }),
      salt: optionalNumber({ max: 1000 }),
    }),
  })
  .refine((p) => p.variants.length === 1 || p.variants.every((v) => v.name), {
    message: "Birden fazla boy varsa her birine ad verin (ör. Küçük, Büyük).",
  });

export type ProductInput = z.infer<typeof productSchema>;

const NUTRITION_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "sugar",
  "salt",
] as const;

/** Ürün formunu şemaya uygun nesneye çevirir. Tekrarlanan alanlar `getAll` ile okunur. */
export function readProductForm(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };
  const all = (key: string) =>
    formData.getAll(key).filter((v) => typeof v === "string");

  const variantNames = all("variantName");
  const variantPrices = all("variantPrice");
  const allergens = [...formData.entries()]
    .filter(([key, value]) => key.startsWith("allergen:") && value !== "NONE")
    .map(([key, level]) => ({
      allergenId: key.slice("allergen:".length),
      level,
    }));

  return {
    categoryId: text("categoryId"),
    name: text("name"),
    description: text("description"),
    ingredients: text("ingredients"),
    portion: text("portion"),
    origin: text("origin"),
    prepTime: text("prepTime"),
    spiceLevel: text("spiceLevel"),
    isVisible: text("isVisible"),
    isAvailable: text("isAvailable"),
    badges: all("badges"),
    tagIds: all("tagIds"),
    allergens,
    variants: variantPrices.map((price, i) => ({
      name: variantNames[i],
      price,
    })),
    nutrition: Object.fromEntries(NUTRITION_KEYS.map((k) => [k, text(k)])),
  };
}

export const reorderSchema = z.object({
  parentId: id,
  ids: z.array(id).min(1).max(1000),
});

export const bulkPriceSchema = z
  .object({
    branchId: id,
    categoryId: z.union([id, z.literal("ALL")]),
    mode: z.enum(["PERCENT", "AMOUNT"]),
    direction: z.enum(["INCREASE", "DECREASE"]),
    value: z.string().trim(),
    rounding: z.coerce
      .number()
      .int()
      .refine((r) => [0, 50, 100, 500].includes(r)),
  })
  .transform((data, ctx) => {
    const n = Number(data.value.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Geçerli bir oran veya tutar girin.",
      });
      return z.NEVER;
    }
    if (data.mode === "PERCENT" && n > 100 && data.direction === "DECREASE") {
      ctx.addIssue({
        code: "custom",
        message: "İndirim oranı %100'den fazla olamaz.",
      });
      return z.NEVER;
    }
    // Tutar TL girilir, kuruşa çevrilir.
    return { ...data, value: data.mode === "AMOUNT" ? Math.round(n * 100) : n };
  });

export const copyMenuSchema = z
  .object({ fromBranchId: id, toBranchId: id, replace: checkbox })
  .refine((d) => d.fromBranchId !== d.toBranchId, {
    message: "Farklı bir şube seçin.",
  });
