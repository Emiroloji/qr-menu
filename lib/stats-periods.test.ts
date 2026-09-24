import { describe, expect, it } from "vitest";
import {
  bucketKey,
  buckets,
  daysAgo,
  parseRange,
  percentChange,
  startOfBucket,
  startOfDay,
} from "@/lib/stats-periods";

// 24 Eylül 2026 Perşembe, Türkiye saatiyle 01:30 (UTC'de hâlâ 23 Eylül).
const NOW = new Date("2026-09-23T22:30:00Z");

describe("istatistik dönemleri", () => {
  it("günün başını Türkiye saatine göre alır", () => {
    expect(startOfDay(NOW).toISOString()).toBe("2026-09-23T21:00:00.000Z");
    expect(daysAgo(NOW, 7).toISOString()).toBe("2026-09-17T21:00:00.000Z");
  });

  it("hafta pazartesi, ay ayın ilk günü başlar", () => {
    expect(bucketKey(startOfBucket("week", NOW))).toBe("2026-09-21");
    expect(bucketKey(startOfBucket("month", NOW))).toBe("2026-09-01");
    expect(bucketKey(startOfBucket("day", NOW))).toBe("2026-09-24");
  });

  it("son dönemleri eskiden yeniye sıralar", () => {
    const days = buckets("day", NOW);
    expect(days).toHaveLength(30);
    expect(days.at(-1)?.key).toBe("2026-09-24");
    expect(days[0].key).toBe("2026-08-26");

    const weeks = buckets("week", NOW);
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)?.key).toBe("2026-09-21");
    expect(weeks.at(-2)?.key).toBe("2026-09-14");

    const months = buckets("month", NOW);
    expect(months.map((b) => b.key).slice(-3)).toEqual([
      "2026-07-01",
      "2026-08-01",
      "2026-09-01",
    ]);
    expect(months[0].key).toBe("2025-10-01");
  });

  it("dönem aralığını yalnızca izinli değerlerden seçer", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange("90")).toBe(90);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });

  it("değişim yüzdesini hesaplar", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(10, 0)).toBeNull();
  });
});
