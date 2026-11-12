import { describe, expect, it } from "vitest";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("consumeRateLimit", () => {
  const rule = { limit: 3, windowMs: 1000 };
  it("limit kadar izin verir, sonra reddeder", () => {
    const key = `t-${Math.random()}`;
    expect([1, 2, 3, 4].map(() => consumeRateLimit(key, rule, 0))).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });
  it("pencere dolunca sıfırlanır", () => {
    const key = `t-${Math.random()}`;
    [1, 2, 3].forEach(() => consumeRateLimit(key, rule, 0));
    expect(consumeRateLimit(key, rule, 999)).toBe(false);
    expect(consumeRateLimit(key, rule, 1000)).toBe(true);
  });
  it("anahtarlar birbirinden bağımsızdır", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    [1, 2, 3].forEach(() => consumeRateLimit(a, rule, 0));
    expect(consumeRateLimit(b, rule, 0)).toBe(true);
  });
});

describe("menü açılışı sınırı", () => {
  it("aynı IP ve şubeden 120 açılışı sayar, fazlasını saymaz; başka şube etkilenmez", () => {
    const ip = `ip-${Math.random()}`;
    const results = Array.from({ length: 125 }, () =>
      consumeRateLimit(`scan:${ip}:sube-1`, RATE_LIMITS.scan, 0),
    );
    expect(results.filter(Boolean)).toHaveLength(120);
    expect(results.slice(120)).toEqual([false, false, false, false, false]);
    expect(consumeRateLimit(`scan:${ip}:sube-2`, RATE_LIMITS.scan, 0)).toBe(
      true,
    );
    // 10 dakika sonra yeniden sayılır.
    expect(
      consumeRateLimit(`scan:${ip}:sube-1`, RATE_LIMITS.scan, 10 * 60_000),
    ).toBe(true);
  });
});

describe("clientIp", () => {
  it("vekilin eklediği ilk IP'yi alır", () => {
    expect(
      clientIp(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.2" })),
    ).toBe("203.0.113.5");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
