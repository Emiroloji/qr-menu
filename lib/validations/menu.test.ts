import { describe, expect, it } from "vitest";
import {
  categorySchema,
  productSchema,
  readProductForm,
} from "@/lib/validations/menu";

function form(entries: [string, string][]) {
  const fd = new FormData();
  entries.forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const base: [string, string][] = [
  ["categoryId", "cat-1"],
  ["name", "Latte"],
  ["isVisible", "on"],
  ["isAvailable", "on"],
  ["spiceLevel", "0"],
];

describe("ürün formu", () => {
  it("boyları, alerjenleri, etiketleri ve besin değerlerini okur", () => {
    const data = productSchema.parse(
      readProductForm(
        form([
          ...base,
          ["variantName", "Küçük"],
          ["variantPrice", "85"],
          ["variantName", "Büyük"],
          ["variantPrice", "110,50"],
          ["allergen:a-milk", "CONTAINS"],
          ["allergen:a-gluten", "MAY_CONTAIN"],
          ["allergen:a-egg", "NONE"],
          ["tagIds", "t-veg"],
          ["badges", "POPULAR"],
          ["calories", "190"],
          ["salt", "0,3"],
        ]),
      ),
    );
    expect(data.variants).toEqual([
      { name: "Küçük", price: 8500 },
      { name: "Büyük", price: 11050 },
    ]);
    expect(data.allergens).toEqual([
      { allergenId: "a-milk", level: "CONTAINS" },
      { allergenId: "a-gluten", level: "MAY_CONTAIN" },
    ]);
    expect(data.tagIds).toEqual(["t-veg"]);
    expect(data.badges).toEqual(["POPULAR"]);
    expect(data.nutrition).toEqual({
      calories: 190,
      protein: null,
      carbs: null,
      fat: null,
      sugar: null,
      salt: 0.3,
    });
    expect(data.isVisible && data.isAvailable).toBe(true);
  });

  it("tek fiyatlı üründe boy adı gerekmez", () => {
    const data = productSchema.parse(
      readProductForm(
        form([...base, ["variantName", ""], ["variantPrice", "70"]]),
      ),
    );
    expect(data.variants).toEqual([{ name: null, price: 7000 }]);
  });

  it("birden fazla boyda ad zorunludur", () => {
    const result = productSchema.safeParse(
      readProductForm(
        form([
          ...base,
          ["variantName", ""],
          ["variantPrice", "70"],
          ["variantName", "Büyük"],
          ["variantPrice", "90"],
        ]),
      ),
    );
    expect(result.error?.issues[0].message).toBe(
      "Birden fazla boy varsa her birine ad verin (ör. Küçük, Büyük).",
    );
  });

  it("fiyatsız ürünü reddeder", () => {
    expect(
      productSchema.safeParse(readProductForm(form(base))).error?.issues[0]
        .message,
    ).toBe("En az bir fiyat girin.");
  });
});

describe("kategori görünme saatleri", () => {
  const category = { name: "Kahvaltı", isVisible: "on" };

  it("saat girilmezse gün boyu görünür", () => {
    const data = categorySchema.parse(category);
    expect(data.availableFrom).toBeNull();
    expect(data.availableTo).toBeNull();
  });
  it("başlangıç ve bitişi birlikte kabul eder", () => {
    const data = categorySchema.parse({
      ...category,
      availableFrom: "08:00",
      availableTo: "11:30",
    });
    expect(data).toMatchObject({
      availableFrom: "08:00",
      availableTo: "11:30",
    });
  });
  it("yalnızca biri girilirse reddeder", () => {
    expect(
      categorySchema.safeParse({ ...category, availableFrom: "08:00" }).success,
    ).toBe(false);
  });
  it("aynı saatleri ve geçersiz saati reddeder", () => {
    expect(
      categorySchema.safeParse({
        ...category,
        availableFrom: "08:00",
        availableTo: "08:00",
      }).success,
    ).toBe(false);
    expect(
      categorySchema.safeParse({
        ...category,
        availableFrom: "25:00",
        availableTo: "11:00",
      }).success,
    ).toBe(false);
  });
});
