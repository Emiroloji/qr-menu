import { describe, expect, it } from "vitest";
import { filterProducts, normalize } from "@/lib/menu-filter";

const p = (
  id: string,
  name: string,
  extra: Partial<Parameters<typeof filterProducts>[0][number]> = {},
) => ({
  id,
  name,
  description: null,
  categoryName: "Kahveler",
  ingredients: null,
  allergens: [],
  tags: [],
  ...extra,
});

const menu = [
  p("latte", "Latte", {
    allergens: [
      { code: "milk", level: "CONTAINS" },
      { code: "gluten", level: "MAY_CONTAIN" },
    ],
    tags: [{ code: "vegetarian" }],
  }),
  p("cay", "Çay", { tags: [{ code: "vegan" }, { code: "vegetarian" }] }),
  p("salata", "Akdeniz Salatası", {
    categoryName: "Salatalar",
    allergens: [{ code: "gluten", level: "MAY_CONTAIN" }],
    tags: [{ code: "vegan" }],
  }),
  p("kek", "Islak Kek", {
    description: "Bitter çikolatalı",
    allergens: [{ code: "gluten", level: "CONTAINS" }],
  }),
];

const ids = (r: ReturnType<typeof filterProducts>) =>
  r.map((x) => x.product.id);

describe("normalize", () => {
  it("Türkçe karakter ve büyük harften bağımsızdır", () => {
    expect(normalize("ÇAY Islak Şöğüt")).toBe("cay islak sogut");
  });
});

describe("filterProducts", () => {
  it("ad, açıklama ve kategoride arar; aksansız yazımı bulur", () => {
    expect(
      ids(filterProducts(menu, { query: "cay", exclude: [], diets: [] })),
    ).toEqual(["cay"]);
    expect(
      ids(filterProducts(menu, { query: "cikolata", exclude: [], diets: [] })),
    ).toEqual(["kek"]);
    expect(
      ids(filterProducts(menu, { query: "salatalar", exclude: [], diets: [] })),
    ).toEqual(["salata"]);
  });

  it("hariç tutulan alerjeni içerenleri çıkarır, iz içerenleri uyarıyla bırakır", () => {
    const result = filterProducts(menu, {
      query: "",
      exclude: ["gluten"],
      diets: [],
    });
    expect(ids(result)).toEqual(["latte", "cay", "salata"]);
    expect(result.find((r) => r.product.id === "salata")?.traces).toEqual([
      "gluten",
    ]);
    expect(result.find((r) => r.product.id === "cay")?.traces).toEqual([]);
  });

  it("seçilen tüm beslenme etiketlerine sahip ürünleri bırakır", () => {
    expect(
      ids(filterProducts(menu, { query: "", exclude: [], diets: ["vegan"] })),
    ).toEqual(["cay", "salata"]);
    expect(
      ids(
        filterProducts(menu, {
          query: "",
          exclude: [],
          diets: ["vegan", "vegetarian"],
        }),
      ),
    ).toEqual(["cay"]);
  });

  it("filtreler birlikte çalışır", () => {
    expect(
      ids(
        filterProducts(menu, {
          query: "salata",
          exclude: ["milk"],
          diets: ["vegan"],
        }),
      ),
    ).toEqual(["salata"]);
  });
});
