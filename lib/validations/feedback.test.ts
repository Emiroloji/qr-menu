import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/validations/feedback";

const base = { branchId: "cmabc123", rating: 5, message: "", lang: "tr" };

describe("değerlendirme doğrulaması", () => {
  it("1–5 arası tam sayı puan kabul eder", () => {
    for (const rating of [1, 3, 5])
      expect(feedbackSchema.safeParse({ ...base, rating }).success).toBe(true);
    for (const rating of [0, 6, 2.5, "5"])
      expect(feedbackSchema.safeParse({ ...base, rating }).success).toBe(false);
  });
  it("boş mesajı null yapar, denetim karakterlerini atar", () => {
    expect(
      feedbackSchema.parse({ ...base, message: "   " }).message,
    ).toBeNull();
    expect(
      feedbackSchema.parse({ ...base, message: " Harika\u0000 " }).message,
    ).toBe("Harika");
  });
  it("500 karakterden uzun mesajı reddeder", () => {
    expect(
      feedbackSchema.safeParse({ ...base, message: "a".repeat(501) }).success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({ ...base, message: "a".repeat(500) }).success,
    ).toBe(true);
  });
  it("bilinmeyen dili reddeder", () => {
    expect(feedbackSchema.safeParse({ ...base, lang: "xx" }).success).toBe(
      false,
    );
  });
});
