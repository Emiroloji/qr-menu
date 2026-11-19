import { describe, expect, it } from "vitest";
import { canUseFeedback, readPlanFeatures } from "@/lib/plan-features";

describe("değerlendirme paket özelliği", () => {
  it("eski paketlerde anahtar yoksa kapalıdır", () => {
    const f = readPlanFeatures({
      appearance: "FULL",
      stats: "DETAILED",
      customDomain: true,
    });
    expect(f.feedback).toBe(false);
    expect(canUseFeedback(f)).toBe(false);
  });
  it("paket ayarında açıksa açıktır", () => {
    const f = readPlanFeatures({
      appearance: "PRESET",
      stats: "NONE",
      feedback: true,
    });
    expect(canUseFeedback(f)).toBe(true);
  });
  it("bozuk değerde kapalıdır", () => {
    expect(canUseFeedback(readPlanFeatures(null))).toBe(false);
  });
});
