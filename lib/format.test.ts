import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatPrice,
  parseDateInput,
  parsePrice,
  slugify,
  toDateInputValue,
} from "@/lib/format";

// Intl bazı ortamlarda boşluk yerine dar/bölünmez boşluk kullanır.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("kuruşu Türk lirası olarak biçimlendirir", () => {
    expect(plain(formatPrice(4550))).toBe("₺45,50");
    expect(plain(formatPrice(125000))).toBe("₺1.250,00");
    expect(plain(formatPrice(0))).toBe("₺0,00");
  });
});

describe("parsePrice", () => {
  it.each([
    ["45,50", 4550],
    ["45.50", 4550],
    ["45", 4500],
    ["1.250", 125000],
    ["1.250,75", 125075],
    ["1250", 125000],
    [" 99,9 ₺", 9990],
    ["0,1", 10],
  ])("%s → %i kuruş", (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  it.each(["", "abc", "-5", "1,2,3", "12,345"])("%s geçersizdir", (input) => {
    expect(parsePrice(input)).toBeNull();
  });
});

describe("tarihler", () => {
  it("bitiş tarihi Türkiye saatiyle günün sonudur", () => {
    const end = parseDateInput("2026-09-30", "end");
    expect(end.toISOString()).toBe("2026-09-30T20:59:59.999Z");
    expect(toDateInputValue(end)).toBe("2026-09-30");
    expect(formatDate(end)).toBe("30 Eylül 2026");
  });

  it("başlangıç tarihi Türkiye saatiyle günün başıdır", () => {
    const start = parseDateInput("2026-09-24", "start");
    expect(start.toISOString()).toBe("2026-09-23T21:00:00.000Z");
    expect(toDateInputValue(start)).toBe("2026-09-24");
  });
});

describe("slugify", () => {
  it("Türkçe karakterleri çevirir ve tire ile ayırır", () => {
    expect(slugify("Kahve Dünyası Kadıköy")).toBe("kahve-dunyasi-kadikoy");
    expect(slugify("  ÇINAR Lokantası & Bar ")).toBe("cinar-lokantasi-bar");
    expect(slugify("Şişli Güneş")).toBe("sisli-gunes");
  });
});
