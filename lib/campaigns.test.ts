import { describe, expect, it } from "vitest";
import {
  campaignStatus,
  specialDateFromKey,
  specialDateKey,
} from "@/lib/campaigns";

const NOW = new Date("2026-09-24T12:00:00Z");
const day = (s: string) => new Date(s);

describe("kampanya durumu", () => {
  const base = {
    isActive: true,
    startsAt: day("2026-09-20T00:00:00Z"),
    endsAt: day("2026-09-30T00:00:00Z"),
  };

  it("tarih aralığındaki açık kampanya yayındadır", () => {
    expect(campaignStatus(base, NOW)).toBe("LIVE");
  });
  it("başlamamış kampanya planlanmıştır", () => {
    expect(
      campaignStatus({ ...base, startsAt: day("2026-09-25T00:00:00Z") }, NOW),
    ).toBe("SCHEDULED");
  });
  it("bitmiş kampanya kapalı olsa da 'sona erdi' görünür", () => {
    expect(
      campaignStatus(
        { ...base, isActive: false, endsAt: day("2026-09-24T11:00:00Z") },
        NOW,
      ),
    ).toBe("ENDED");
  });
  it("kapatılan kampanya menüde görünmez", () => {
    expect(campaignStatus({ ...base, isActive: false }, NOW)).toBe("OFF");
  });
});

describe("günün önerisi tarihi", () => {
  it("tarih anahtarına ve geri çevirir", () => {
    const date = specialDateFromKey("2026-09-24");
    expect(date.toISOString()).toBe("2026-09-24T00:00:00.000Z");
    expect(specialDateKey(date)).toBe("2026-09-24");
  });
});
