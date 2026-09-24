import { describe, expect, it } from "vitest";
import {
  getBusinessStatus,
  getCurrentSubscription,
} from "@/lib/business-status";

const now = new Date("2026-09-24T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const sub = (
  startsAt: Date,
  endsAt: Date,
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED" = "ACTIVE",
) => ({
  status,
  startsAt,
  endsAt,
});

describe("getBusinessStatus", () => {
  it("pasif işletme, aboneliği ne olursa olsun pasiftir", () => {
    expect(
      getBusinessStatus(
        { isActive: false, subscriptions: [sub(days(-1), days(300))] },
        now,
      ),
    ).toBe("PASSIVE");
  });

  it("geçerli aboneliği olan işletme aktiftir", () => {
    expect(
      getBusinessStatus(
        { isActive: true, subscriptions: [sub(days(-10), days(300))] },
        now,
      ),
    ).toBe("ACTIVE");
  });

  it("bitişe 7 gün veya daha az kaldıysa süresi yaklaşıyordur", () => {
    expect(
      getBusinessStatus(
        { isActive: true, subscriptions: [sub(days(-10), days(7))] },
        now,
      ),
    ).toBe("EXPIRING");
    expect(
      getBusinessStatus(
        { isActive: true, subscriptions: [sub(days(-10), days(8))] },
        now,
      ),
    ).toBe("ACTIVE");
  });

  it("bitmiş, henüz başlamamış veya hiç aboneliği olmayan işletmenin süresi dolmuştur", () => {
    expect(
      getBusinessStatus(
        { isActive: true, subscriptions: [sub(days(-400), days(-1))] },
        now,
      ),
    ).toBe("EXPIRED");
    expect(
      getBusinessStatus(
        { isActive: true, subscriptions: [sub(days(1), days(300))] },
        now,
      ),
    ).toBe("EXPIRED");
    expect(getBusinessStatus({ isActive: true, subscriptions: [] }, now)).toBe(
      "EXPIRED",
    );
  });

  it("askıya alınmış abonelik askıdadır", () => {
    expect(
      getBusinessStatus(
        {
          isActive: true,
          subscriptions: [sub(days(-1), days(300), "SUSPENDED")],
        },
        now,
      ),
    ).toBe("SUSPENDED");
  });
});

describe("getCurrentSubscription", () => {
  it("tarih aralığındaki en geç biten aboneliği seçer", () => {
    const a = sub(days(-100), days(10));
    const b = sub(days(-5), days(200));
    expect(getCurrentSubscription([a, b], now)).toBe(b);
  });

  it("sona erdirilmiş aboneliği yok sayar", () => {
    expect(
      getCurrentSubscription([sub(days(-1), days(10), "EXPIRED")], now),
    ).toBeNull();
  });
});
