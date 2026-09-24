import { describe, expect, it } from "vitest";
import { applyPriceChange } from "@/lib/pricing";

describe("applyPriceChange", () => {
  it("yüzde zam uygular ve 1 TL'ye yuvarlar", () => {
    expect(
      applyPriceChange(8500, {
        mode: "PERCENT",
        direction: "INCREASE",
        value: 10,
        rounding: 100,
      }),
    ).toBe(9400);
  });
  it("yuvarlama olmadan kuruşa yuvarlar", () => {
    expect(
      applyPriceChange(8550, {
        mode: "PERCENT",
        direction: "INCREASE",
        value: 7,
        rounding: 0,
      }),
    ).toBe(9149);
  });
  it("tutar indirimi uygular", () => {
    expect(
      applyPriceChange(6500, {
        mode: "AMOUNT",
        direction: "DECREASE",
        value: 500,
        rounding: 0,
      }),
    ).toBe(6000);
  });
  it("0,50 TL'ye yuvarlar", () => {
    expect(
      applyPriceChange(7000, {
        mode: "PERCENT",
        direction: "DECREASE",
        value: 3,
        rounding: 50,
      }),
    ).toBe(6800);
  });
  it("sıfırın altına düşebilen sonucu olduğu gibi döner (kontrol çağıranda)", () => {
    expect(
      applyPriceChange(300, {
        mode: "AMOUNT",
        direction: "DECREASE",
        value: 500,
        rounding: 0,
      }),
    ).toBe(-200);
  });
});
