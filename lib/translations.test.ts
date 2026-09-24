import { describe, expect, it } from "vitest";
import {
  isProductMissing,
  missingFields,
  setTranslation,
} from "@/lib/translations";

const latte = {
  name: "Latte",
  description: "Espresso ve süt",
  translations: { en: { name: "Latte" } },
  variants: [{ name: "Küçük", translations: { en: { name: "Small" } } }],
};

describe("missingFields", () => {
  it("Türkçesi dolu, çevirisi boş alanları bulur", () => {
    expect(missingFields(latte, "en")).toEqual(["description"]);
    expect(missingFields(latte, "de")).toEqual(["name", "description"]);
  });
  it("Türkçesi boş alan eksik sayılmaz", () => {
    expect(missingFields({ name: null, translations: {} }, "en")).toEqual([]);
  });
});

describe("isProductMissing", () => {
  it("ürün veya adı olan boyu çevrilmemişse eksiktir", () => {
    expect(isProductMissing(latte, "en")).toBe(true);
    const done = {
      ...latte,
      translations: { en: { name: "Latte", description: "Espresso and milk" } },
    };
    expect(isProductMissing(done, "en")).toBe(false);
    expect(
      isProductMissing(
        { ...done, variants: [{ name: "Küçük", translations: {} }] },
        "en",
      ),
    ).toBe(true);
    expect(
      isProductMissing(
        { ...done, variants: [{ name: null, translations: {} }] },
        "en",
      ),
    ).toBe(false);
  });
});

describe("setTranslation", () => {
  it("yalnızca seçilen dili günceller, boş değeri kaldırır", () => {
    const current = {
      en: { name: "Latte", description: "Old" },
      de: { name: "Latte" },
    };
    expect(setTranslation(current, "en", { description: " " })).toEqual({
      en: { name: "Latte" },
      de: { name: "Latte" },
    });
    expect(setTranslation(current, "de", { name: "" })).toEqual({
      en: { name: "Latte", description: "Old" },
    });
    expect(setTranslation({}, "ru", { name: " Латте " })).toEqual({
      ru: { name: "Латте" },
    });
  });
});
