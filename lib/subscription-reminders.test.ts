import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn() }));

import {
  reminderMail,
  subscriptionToRemind,
} from "@/lib/subscription-reminders";

const NOW = new Date("2026-09-24T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 24 * 60 * 60 * 1000);
const sub = (overrides: object = {}) => ({
  id: "s1",
  status: "ACTIVE" as const,
  startsAt: days(-300),
  endsAt: days(5),
  reminderSentAt: null,
  ...overrides,
});

describe("abonelik hatırlatması", () => {
  it("bitişe 7 gün veya daha az kalan aboneliği seçer", () => {
    expect(subscriptionToRemind([sub()], NOW)?.id).toBe("s1");
    expect(subscriptionToRemind([sub({ endsAt: days(7) })], NOW)?.id).toBe(
      "s1",
    );
  });
  it("bitişe daha çok varsa göndermez", () => {
    expect(subscriptionToRemind([sub({ endsAt: days(8) })], NOW)).toBeNull();
  });
  it("aynı abonelik için ikinci kez göndermez", () => {
    expect(
      subscriptionToRemind([sub({ reminderSentAt: days(-1) })], NOW),
    ).toBeNull();
  });
  it("askıdaki aboneliğe göndermez", () => {
    expect(
      subscriptionToRemind([sub({ status: "SUSPENDED" })], NOW),
    ).toBeNull();
  });
  it("arkasından yeni abonelik başlayacaksa göndermez", () => {
    const next = sub({ id: "s2", startsAt: days(5), endsAt: days(370) });
    expect(subscriptionToRemind([sub(), next], NOW)).toBeNull();
  });
  it("e-postada kalan gün, işletme ve bitiş tarihi yazar", () => {
    const mail = reminderMail({
      ownerName: "Ayşe",
      businessName: "Limon Kafe",
      planName: "Standart",
      endsAt: days(5),
      now: NOW,
    });
    expect(mail.subject).toBe("Aboneliğinizin bitmesine 5 gün kaldı");
    expect(mail.text).toContain("Limon Kafe işletmesinin Standart paket");
    expect(mail.text).toContain("29 Eylül 2026");
  });
});
