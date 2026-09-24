import { describe, expect, it } from "vitest";
import { contrastRatio, mix, onColor, readableOn } from "@/lib/color";

describe("kontrast", () => {
  it("siyah-beyaz 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });
  it("koyu renk üstüne beyaz, açık renk üstüne koyu metin", () => {
    expect(onColor("#2F5D50")).toBe("#FFFFFF");
    expect(onColor("#D8F55A")).toBe("#111111");
  });
  it("açık bir rengi açık zeminde okunur olana kadar koyulaştırır", () => {
    const result = readableOn("#F5C518", "#FFFFFF");
    expect(contrastRatio(result, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  it("koyu bir rengi koyu zeminde okunur olana kadar açar", () => {
    const result = readableOn("#2F5D50", "#121211");
    expect(contrastRatio(result, "#121211")).toBeGreaterThanOrEqual(4.5);
  });
  it("zaten okunur rengi değiştirmez", () => {
    expect(readableOn("#2F5D50", "#FFFFFF")).toBe("#2F5D50");
  });
  it("mix beyaza ve siyaha karıştırır", () => {
    expect(mix("#000000", 1)).toBe("#FFFFFF");
    expect(mix("#FFFFFF", -1)).toBe("#000000");
  });
});
