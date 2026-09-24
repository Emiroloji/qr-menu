import { describe, expect, it } from "vitest";
import { branchSchema, normalizeSocial } from "@/lib/validations/branch";

describe("normalizeSocial", () => {
  it("kullanıcı adını tam adrese çevirir", () => {
    expect(normalizeSocial("instagram", "@limonkafe")).toBe(
      "https://instagram.com/limonkafe",
    );
    expect(normalizeSocial("tiktok", "limonkafe")).toBe(
      "https://tiktok.com/@limonkafe",
    );
    expect(normalizeSocial("website", "limonkafe.com")).toBe(
      "https://limonkafe.com",
    );
  });
  it("tam adresi olduğu gibi bırakır, boşu yok sayar", () => {
    expect(normalizeSocial("facebook", "https://facebook.com/limon")).toBe(
      "https://facebook.com/limon",
    );
    expect(normalizeSocial("x", "  ")).toBeNull();
  });
});

describe("branchSchema", () => {
  const base = { name: "Kadıköy", slug: "kadikoy" };

  it("açık günleri saat aralığına, kapalı günleri boş diziye çevirir", () => {
    const result = branchSchema.parse({
      ...base,
      mon_open: "on",
      mon_from: "08:00",
      mon_to: "23:00",
      sat_open: "on",
      sat_from: "18:00",
      sat_to: "02:00",
      instagram: "@limonkafe",
    });
    expect(result.openingHours.mon).toEqual([["08:00", "23:00"]]);
    expect(result.openingHours.sat).toEqual([["18:00", "02:00"]]);
    expect(result.openingHours.sun).toEqual([]);
    expect(result.socials).toEqual({
      instagram: "https://instagram.com/limonkafe",
    });
    expect(result.address).toBeNull();
  });

  it("açık günün saati eksikse hata verir", () => {
    const result = branchSchema.safeParse({
      ...base,
      tue_open: "on",
      tue_from: "08:00",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "Salı: açılış ve kapanış saatini girin.",
    );
  });

  it("geçersiz adresi reddeder", () => {
    expect(
      branchSchema.safeParse({ ...base, slug: "Kadıköy Şube" }).success,
    ).toBe(false);
  });
});

describe("şube dilleri", () => {
  it("Türkçe her zaman ilk ve açıktır, bilinmeyen kodlar atılır", () => {
    const result = branchSchema.parse({
      name: "Kadıköy",
      slug: "kadikoy",
      languages: ["en", "xx", "tr", "en", "ar"],
    });
    expect(result.languages).toEqual(["tr", "en", "ar"]);
    expect(
      branchSchema.parse({ name: "Moda", slug: "moda" }).languages,
    ).toEqual(["tr"]);
  });
});
