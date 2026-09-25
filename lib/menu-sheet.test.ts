import { describe, expect, it } from "vitest";
import {
  mapHeaders,
  parseSheetRows,
  type Reference,
  toSheetRow,
} from "@/lib/menu-sheet";

const ref: Reference = {
  allergens: [
    { code: "milk", name: "Süt" },
    { code: "gluten", name: "Gluten" },
    { code: "eggs", name: "Yumurta" },
  ],
  tags: [{ code: "vegetarian", name: "Vejetaryen" }],
};
const parse = (values: Record<string, string>, row = 2) =>
  parseSheetRows([{ row, values }], ref);

describe("Excel içe aktarma", () => {
  it("tek fiyatlı ürünü, alerjenleri ve etiketleri okur", () => {
    const { items, errors } = parse({
      category: "Kahveler",
      name: " Latte ",
      price: "85,50",
      contains: "süt",
      mayContain: "Gluten",
      tags: "Vejetaryen",
      badges: "Popüler",
      spiceLevel: "",
      isAvailable: "Hayır",
    });
    expect(errors).toEqual([]);
    expect(items[0]).toMatchObject({
      name: "Latte",
      variants: [{ name: null, price: 8550 }],
      allergens: [
        { code: "milk", level: "CONTAINS" },
        { code: "gluten", level: "MAY_CONTAIN" },
      ],
      tagCodes: ["vegetarian"],
      badges: ["POPULAR"],
      spiceLevel: 0,
      isVisible: true,
      isAvailable: false,
    });
  });

  it("boyları okur; Excel sayı hücresindeki noktalı fiyatı da kabul eder", () => {
    const { items } = parse({
      category: "Kahveler",
      name: "Mocha",
      sizes: "Orta=105; Büyük=120,50",
    });
    expect(items[0].variants).toEqual([
      { name: "Orta", price: 10500 },
      { name: "Büyük", price: 12050 },
    ]);
    expect(
      parse({ category: "A", name: "B", price: "85.5" }).items[0].variants,
    ).toEqual([{ name: null, price: 8550 }]);
  });

  it("hatalı satırları satır numarasıyla bildirir, diğerlerini okur", () => {
    const { items, errors } = parseSheetRows(
      [
        {
          row: 2,
          values: { category: "Tatlılar", name: "Sufle", price: "abc" },
        },
        { row: 3, values: { category: "Tatlılar", name: "Kek", price: "60" } },
        { row: 4, values: { category: "Tatlılar", name: "Kek", price: "65" } },
        { row: 5, values: { category: "", name: "Tost", price: "90" } },
        {
          row: 6,
          values: { category: "A", name: "B", price: "1", contains: "Fındık" },
        },
        { row: 7, values: {} },
      ],
      ref,
    );
    expect(items.map((i) => i.name)).toEqual(["Kek"]);
    expect(errors).toEqual([
      { row: 2, message: 'Fiyat okunamadı: "abc".' },
      { row: 4, message: "Aynı ürün 3. satırda da var." },
      { row: 5, message: "Kategori boş olamaz." },
      { row: 6, message: 'Bilinmeyen alerjen: "Fındık".' },
    ]);
  });

  it("fiyatsız ürünü ve aynı alerjeni iki sütunda reddeder", () => {
    expect(parse({ category: "A", name: "B" }).errors[0].message).toBe(
      "Fiyat veya Boylar sütununu doldurun.",
    );
    expect(
      parse({
        category: "A",
        name: "B",
        price: "1",
        contains: "Süt",
        mayContain: "süt",
      }).errors[0].message,
    ).toContain("hem “içerir” hem “iz”");
  });

  it("başlıkları büyük/küçük harf farkıyla eşler, zorunlu sütunları ister", () => {
    expect(mapHeaders(["KATEGORİ", "Ürün", "Bilinmeyen"])).toEqual({
      keys: ["category", "name", null],
      missing: [],
    });
    expect(mapHeaders(["Ürün"]).missing).toEqual(["Kategori"]);
  });
});

describe("Excel dışa aktarma", () => {
  it("dışa aktarılan satır içe aktarılınca aynı ürünü verir", () => {
    const product = {
      category: "Kahveler",
      name: "Latte",
      description: "Süt köpüklü",
      variants: [
        { name: "Küçük", price: 8500 },
        { name: "Büyük", price: 11050 },
      ],
      ingredients: null,
      portion: "350 ml",
      prepTime: 5,
      origin: null,
      spiceLevel: 0,
      allergens: [{ code: "milk", level: "CONTAINS" as const }],
      tagCodes: ["vegetarian"],
      badges: ["POPULAR" as const],
      isVisible: true,
      isAvailable: true,
    };
    const row = toSheetRow(product, ref);
    expect(row.sizes).toBe("Küçük=85,00; Büyük=110,50");
    const values = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, v === null ? "" : String(v)]),
    );
    const { items, errors } = parse(values);
    expect(errors).toEqual([]);
    expect(items[0]).toMatchObject({ ...product, row: 2 });
  });
});
