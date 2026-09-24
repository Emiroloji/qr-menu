import { describe, expect, it } from "vitest";
import { campaignSchema } from "@/lib/validations/campaign";

describe("kampanya formu", () => {
  const valid = {
    title: " Sonbahar indirimi ",
    startsAt: "2026-10-01",
    endsAt: "2026-10-15",
    isActive: "on",
  };

  it("geçerli kampanyayı kabul eder", () => {
    expect(campaignSchema.parse(valid)).toEqual({
      title: "Sonbahar indirimi",
      description: null,
      startsAt: "2026-10-01",
      endsAt: "2026-10-15",
      isActive: true,
    });
  });
  it("tek günlük kampanyaya izin verir", () => {
    expect(
      campaignSchema.safeParse({ ...valid, endsAt: "2026-10-01" }).success,
    ).toBe(true);
  });
  it("bitişi başlangıçtan önce olan kampanyayı reddeder", () => {
    const result = campaignSchema.safeParse({ ...valid, endsAt: "2026-09-30" });
    expect(result.error?.issues[0].message).toBe(
      "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    );
  });
  it("başlıksız kampanyayı reddeder", () => {
    expect(campaignSchema.safeParse({ ...valid, title: " " }).success).toBe(
      false,
    );
  });
});
