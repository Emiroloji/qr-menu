import { describe, expect, it } from "vitest";
import { isWithinServiceHours } from "@/lib/service-hours";

// Türkiye saati = UTC + 3
const at = (time: string) => new Date(`2026-09-24T${time}:00+03:00`);
const breakfast = { from: "08:00", to: "11:00" };
const night = { from: "22:00", to: "02:00" };

describe("servis saatleri", () => {
  it("başlangıç dahil, bitiş hariç", () => {
    expect(isWithinServiceHours(breakfast, at("07:59"))).toBe(false);
    expect(isWithinServiceHours(breakfast, at("08:00"))).toBe(true);
    expect(isWithinServiceHours(breakfast, at("10:59"))).toBe(true);
    expect(isWithinServiceHours(breakfast, at("11:00"))).toBe(false);
  });
  it("Türkiye saatine göre hesaplar", () => {
    // 05:30 UTC = 08:30 Türkiye
    expect(
      isWithinServiceHours(breakfast, new Date("2026-09-24T05:30:00Z")),
    ).toBe(true);
  });
  it("gece yarısını geçen aralık", () => {
    expect(isWithinServiceHours(night, at("23:30"))).toBe(true);
    expect(isWithinServiceHours(night, at("01:59"))).toBe(true);
    expect(isWithinServiceHours(night, at("02:00"))).toBe(false);
    expect(isWithinServiceHours(night, at("12:00"))).toBe(false);
  });
});
