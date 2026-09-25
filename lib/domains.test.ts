import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { activeCustomDomain, checkDomainDns } from "@/lib/domains";

const PRO = { appearance: "FULL", stats: "DETAILED", customDomain: true };
const STANDARD = {
  appearance: "BRANDING",
  stats: "BASIC",
  customDomain: false,
};

describe("DNS doğrulaması", () => {
  it("alan adı sunucumuzun adresini gösteriyorsa geçer", async () => {
    const resolver = vi.fn(async () => ["203.0.113.5"]);
    const result = await checkDomainDns("menu.isletme.com", resolver, [
      "203.0.113.5",
    ]);
    expect(result.ok).toBe(true);
  });
  it("başka bir sunucuyu gösteriyorsa veya kayıt yoksa geçmez", async () => {
    const other = await checkDomainDns(
      "menu.isletme.com",
      async () => ["198.51.100.7"],
      ["203.0.113.5"],
    );
    expect(other).toMatchObject({ ok: false, found: ["198.51.100.7"] });
    const none = await checkDomainDns(
      "menu.isletme.com",
      async () => {
        throw new Error("ENOTFOUND");
      },
      ["203.0.113.5"],
    );
    expect(none).toMatchObject({ ok: false, found: [] });
  });
});

describe("kullanılan alan adı", () => {
  const verified = {
    customDomain: "menu.isletme.com",
    customDomainVerifiedAt: new Date(),
  };
  it("doğrulanmış ve paket izin veriyorsa kullanılır", () => {
    expect(activeCustomDomain(verified, PRO)).toBe("menu.isletme.com");
  });
  it("doğrulanmamışsa veya paket izin vermiyorsa kullanılmaz", () => {
    expect(
      activeCustomDomain({ ...verified, customDomainVerifiedAt: null }, PRO),
    ).toBeNull();
    expect(activeCustomDomain(verified, STANDARD)).toBeNull();
  });
});
