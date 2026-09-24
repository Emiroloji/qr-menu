import { describe, expect, it } from "vitest";
import { pickLanguage } from "@/lib/languages";

describe("pickLanguage", () => {
  const branch = ["tr", "en", "de"];
  it("adresteki dil şubede açıksa onu seçer", () => {
    expect(pickLanguage("de", branch, "en-US")).toBe("de");
  });
  it("adresteki dil şubede kapalıysa tarayıcı diline bakar", () => {
    expect(pickLanguage("ru", branch, "en-GB,en;q=0.9")).toBe("en");
  });
  it("tarayıcı dillerini öncelik sırasına göre dener", () => {
    expect(pickLanguage(null, branch, "ru-RU,ru;q=0.9,de;q=0.8,en;q=0.7")).toBe(
      "de",
    );
  });
  it("uygun dil yoksa Türkçe", () => {
    expect(pickLanguage(null, branch, "fr-FR")).toBe("tr");
    expect(pickLanguage(null, ["tr"], "en")).toBe("tr");
    expect(pickLanguage(null, branch, null)).toBe("tr");
  });
});
