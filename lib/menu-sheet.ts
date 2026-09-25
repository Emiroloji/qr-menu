import type { AllergenLevel, Badge } from "@/lib/generated/prisma/enums";
import { formatPriceText, parsePrice } from "@/lib/format";
import { BADGES } from "@/lib/validations/menu";

// Menünün Excel biçimi (Faz 3.3). Her satır bir üründür. Bu dosya Excel kütüphanesinden
// bağımsızdır: dışa aktarma satırları üretir, içe aktarma satırları doğrular.

export const COLUMNS = [
  { key: "category", header: "Kategori", width: 20 },
  { key: "name", header: "Ürün", width: 28 },
  { key: "description", header: "Açıklama", width: 40 },
  { key: "price", header: "Fiyat (TL)", width: 12 },
  { key: "sizes", header: "Boylar", width: 34 },
  { key: "ingredients", header: "İçindekiler", width: 30 },
  { key: "portion", header: "Porsiyon", width: 14 },
  { key: "prepTime", header: "Hazırlanma (dk)", width: 16 },
  { key: "origin", header: "Menşe", width: 14 },
  { key: "spiceLevel", header: "Acılık (0-3)", width: 12 },
  { key: "contains", header: "Alerjenler (içerir)", width: 30 },
  { key: "mayContain", header: "Alerjenler (iz)", width: 24 },
  { key: "tags", header: "Etiketler", width: 20 },
  { key: "badges", header: "Rozetler", width: 18 },
  { key: "isVisible", header: "Menüde görünür", width: 15 },
  { key: "isAvailable", header: "Mevcut", width: 10 },
] as const;
export type ColumnKey = (typeof COLUMNS)[number]["key"];
export type SheetRow = Partial<Record<ColumnKey, string>>;

export const MAX_IMPORT_ROWS = 1000;
const YES = "Evet";
const NO = "Hayır";

export type Reference = {
  allergens: { code: string; name: string }[];
  tags: { code: string; name: string }[];
};

// ---------- Dışa aktarma ----------

export type ExportProduct = {
  category: string;
  name: string;
  description: string | null;
  variants: { name: string | null; price: number }[];
  ingredients: string | null;
  portion: string | null;
  prepTime: number | null;
  origin: string | null;
  spiceLevel: number;
  allergens: { code: string; level: AllergenLevel }[];
  tagCodes: string[];
  badges: Badge[];
  isVisible: boolean;
  isAvailable: boolean;
};

const priceNumber = (kurus: number) => kurus / 100;
/** "85,00 TL" → "85,00" (Boylar hücresinde) */
const priceCell = (kurus: number) => formatPriceText(kurus).replace(" TL", "");

/** Ürünü Excel satırına çevirir. Tek fiyatlı ürün "Fiyat", çok boylu ürün "Boylar" kullanır. */
export function toSheetRow(
  product: ExportProduct,
  ref: Reference,
): Record<ColumnKey, string | number | null> {
  const allergenName = new Map(ref.allergens.map((a) => [a.code, a.name]));
  const tagName = new Map(ref.tags.map((t) => [t.code, t.name]));
  const names = (level: AllergenLevel) =>
    product.allergens
      .filter((a) => a.level === level)
      .map((a) => allergenName.get(a.code) ?? a.code)
      .join(", ");
  const single =
    product.variants.length === 1 && !product.variants[0].name
      ? product.variants[0]
      : null;
  return {
    category: product.category,
    name: product.name,
    description: product.description,
    price: single ? priceNumber(single.price) : null,
    sizes: single
      ? null
      : product.variants
          .map((v) => `${v.name ?? ""}=${priceCell(v.price)}`)
          .join("; "),
    ingredients: product.ingredients,
    portion: product.portion,
    prepTime: product.prepTime,
    origin: product.origin,
    spiceLevel: product.spiceLevel,
    contains: names("CONTAINS"),
    mayContain: names("MAY_CONTAIN"),
    tags: product.tagCodes.map((c) => tagName.get(c) ?? c).join(", "),
    badges: product.badges.map((b) => BADGES[b]).join(", "),
    isVisible: product.isVisible ? YES : NO,
    isAvailable: product.isAvailable ? YES : NO,
  };
}

// ---------- İçe aktarma ----------

export type ImportProduct = {
  row: number;
  category: string;
  name: string;
  description: string | null;
  variants: { name: string | null; price: number }[];
  ingredients: string | null;
  portion: string | null;
  prepTime: number | null;
  origin: string | null;
  spiceLevel: number;
  allergens: { code: string; level: AllergenLevel }[];
  tagCodes: string[];
  badges: Badge[];
  isVisible: boolean;
  isAvailable: boolean;
};
export type ImportError = { row: number; message: string };

const key = (value: string) => value.trim().toLocaleLowerCase("tr-TR");
const list = (value: string | undefined) =>
  (value ?? "")
    .split(/[,;]/)
    .map((v) => v.trim())
    .filter(Boolean);

/** Başlık satırındaki sütun adlarını sütun anahtarlarına eşler. */
export function mapHeaders(headers: string[]) {
  const byHeader = new Map(COLUMNS.map((c) => [key(c.header), c.key]));
  const missing = COLUMNS.filter(
    (c) =>
      (c.key === "category" || c.key === "name") &&
      !headers.some((h) => key(h) === key(c.header)),
  ).map((c) => c.header);
  return {
    keys: headers.map((h) => byHeader.get(key(h)) ?? null),
    missing,
  };
}

function text(value: string | undefined, max: number, label: string) {
  const v = (value ?? "").trim();
  if (v.length > max)
    throw new Error(`${label} en fazla ${max} karakter olabilir.`);
  return v || null;
}

function yesNo(value: string | undefined, fallback: boolean) {
  const v = key(value ?? "");
  if (!v) return fallback;
  if (["evet", "e", "yes", "1", "var", "x"].includes(v)) return true;
  if (["hayır", "hayir", "h", "no", "0", "yok"].includes(v)) return false;
  throw new Error(`"${value}" için Evet veya Hayır yazın.`);
}

function parseVariants(row: SheetRow) {
  const sizes = (row.sizes ?? "").trim();
  if (sizes) {
    const variants = sizes
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, price] = part.split("=").map((s) => s?.trim() ?? "");
        const kurus = price ? parsePrice(price) : null;
        if (!name || kurus === null)
          throw new Error(
            `Boylar "Küçük=85; Orta=95" biçiminde olmalı ("${part}" okunamadı).`,
          );
        if (name.length > 60)
          throw new Error("Boy adı en fazla 60 karakter olabilir.");
        return { name, price: kurus };
      });
    if (variants.length > 10) throw new Error("En fazla 10 boy girilebilir.");
    return variants;
  }
  const price = (row.price ?? "").trim();
  if (!price) throw new Error("Fiyat veya Boylar sütununu doldurun.");
  const kurus = parsePrice(price);
  if (kurus === null) throw new Error(`Fiyat okunamadı: "${price}".`);
  return [{ name: null, price: kurus }];
}

function parseInteger(
  value: string | undefined,
  { min, max, label }: { min: number; max: number; label: string },
) {
  const v = (value ?? "").trim();
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error(`${label} ${min}–${max} arasında bir tam sayı olmalı.`);
  return n;
}

/** Satırları doğrular. Hatalı satırlar `errors` içinde satır numarasıyla döner. */
export function parseSheetRows(
  rows: { row: number; values: SheetRow }[],
  ref: Reference,
) {
  const allergenByName = new Map(
    ref.allergens.map((a) => [key(a.name), a.code]),
  );
  const tagByName = new Map(ref.tags.map((t) => [key(t.name), t.code]));
  const badgeByName = new Map(
    Object.entries(BADGES).map(([code, label]) => [key(label), code as Badge]),
  );
  const items: ImportProduct[] = [];
  const errors: ImportError[] = [];
  const seen = new Map<string, number>();

  for (const { row, values } of rows) {
    // Tamamen boş satırlar atlanır.
    if (Object.values(values).every((v) => !v?.trim())) continue;
    try {
      const category = text(values.category, 80, "Kategori");
      const name = text(values.name, 120, "Ürün adı");
      if (!category) throw new Error("Kategori boş olamaz.");
      if (!name) throw new Error("Ürün adı boş olamaz.");

      const duplicate = seen.get(`${key(category)}|${key(name)}`);
      if (duplicate) throw new Error(`Aynı ürün ${duplicate}. satırda da var.`);
      seen.set(`${key(category)}|${key(name)}`, row);

      const lookup = (
        names: string[],
        map: Map<string, string>,
        label: string,
      ) =>
        names.map((n) => {
          const code = map.get(key(n));
          if (!code) throw new Error(`Bilinmeyen ${label}: "${n}".`);
          return code;
        });
      const contains = lookup(list(values.contains), allergenByName, "alerjen");
      const mayContain = lookup(
        list(values.mayContain),
        allergenByName,
        "alerjen",
      );
      const both = contains.find((c) => mayContain.includes(c));
      if (both)
        throw new Error("Bir alerjen hem “içerir” hem “iz” sütununda olamaz.");

      items.push({
        row,
        category,
        name,
        description: text(values.description, 500, "Açıklama"),
        variants: parseVariants(values),
        ingredients: text(values.ingredients, 500, "İçindekiler"),
        portion: text(values.portion, 60, "Porsiyon"),
        prepTime: parseInteger(values.prepTime, {
          min: 0,
          max: 600,
          label: "Hazırlanma süresi",
        }),
        origin: text(values.origin, 60, "Menşe"),
        spiceLevel:
          parseInteger(values.spiceLevel, {
            min: 0,
            max: 3,
            label: "Acılık",
          }) ?? 0,
        allergens: [
          ...contains.map((code) => ({ code, level: "CONTAINS" as const })),
          ...mayContain.map((code) => ({
            code,
            level: "MAY_CONTAIN" as const,
          })),
        ],
        tagCodes: [...new Set(lookup(list(values.tags), tagByName, "etiket"))],
        badges: [
          ...new Set(
            lookup(list(values.badges), badgeByName, "rozet") as Badge[],
          ),
        ],
        isVisible: yesNo(values.isVisible, true),
        isAvailable: yesNo(values.isAvailable, true),
      });
    } catch (error) {
      errors.push({
        row,
        message: error instanceof Error ? error.message : "Satır okunamadı.",
      });
    }
  }
  return { items, errors };
}
