import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/color";
import {
  effectiveAppearance,
  MENU_THEME_CODES,
  themeVariables,
} from "@/lib/menu-themes";

const business = {
  theme: "warm",
  primaryColor: "#123456",
  logoUrl: "logo",
  coverUrl: "cover",
};

describe("effectiveAppearance (paket özellikleri)", () => {
  it("Başlangıç: hazır tema, tema rengi, logo ve kapak yok", () => {
    expect(
      effectiveAppearance(business, {
        appearance: "PRESET",
        stats: "NONE",
        customDomain: false,
      }),
    ).toEqual({
      theme: "warm",
      color: "#B4532A",
      logoUrl: null,
      coverUrl: null,
    });
  });
  it("Standart: logo ve renk var, kapak yok", () => {
    expect(
      effectiveAppearance(business, {
        appearance: "BRANDING",
        stats: "BASIC",
        customDomain: false,
      }),
    ).toEqual({
      theme: "warm",
      color: "#123456",
      logoUrl: "logo",
      coverUrl: null,
    });
  });
  it("Pro: hepsi", () => {
    expect(
      effectiveAppearance(business, {
        appearance: "FULL",
        stats: "DETAILED",
        customDomain: true,
      }).coverUrl,
    ).toBe("cover");
  });
  it("bilinmeyen tema Minimal'e düşer", () => {
    expect(
      effectiveAppearance(
        { ...business, theme: "yok" },
        { appearance: "FULL", stats: "NONE", customDomain: false },
      ).theme,
    ).toBe("minimal");
  });
});

describe("themeVariables (okunaklılık)", () => {
  it.each(MENU_THEME_CODES)(
    "%s: her renkte vurgu metni zeminde en az 4.5:1",
    (theme) => {
      for (const brand of [
        "#FFFF00",
        "#2F5D50",
        "#000000",
        "#FFFFFF",
        "#C9A96E",
      ]) {
        for (const mode of ["light", "dark"] as const) {
          const v = themeVariables(theme, brand)[mode];
          expect(
            contrastRatio(v["--m-accent-text"], v["--m-bg"]),
          ).toBeGreaterThanOrEqual(4.5);
          expect(
            contrastRatio(v["--m-on-accent"], v["--m-accent"]),
          ).toBeGreaterThanOrEqual(3);
        }
      }
    },
  );
});
