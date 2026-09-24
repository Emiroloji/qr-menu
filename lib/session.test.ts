import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));

import { requireRole, requireSession } from "@/lib/session";

function loggedInAs(user: object | null) {
  mocks.getSession.mockResolvedValue(user ? { user: { id: "u1" } } : null);
  mocks.findUnique.mockResolvedValue(user);
}

beforeEach(() => vi.clearAllMocks());

describe("requireRole", () => {
  it("oturum yoksa girişe yönlendirir", async () => {
    loggedInAs(null);
    await expect(requireRole("SUPER_ADMIN")).rejects.toThrow("REDIRECT:/login");
  });

  it("işletme sahibi admin alanına giremez, paneline yönlendirilir", async () => {
    loggedInAs({
      id: "u1",
      role: "OWNER",
      businessId: "biz-1",
      permissions: [],
    });
    await expect(requireRole("SUPER_ADMIN")).rejects.toThrow("REDIRECT:/panel");
  });

  it("çalışan admin alanına giremez", async () => {
    loggedInAs({
      id: "u1",
      role: "STAFF",
      businessId: "biz-1",
      permissions: [],
    });
    await expect(requireRole("SUPER_ADMIN")).rejects.toThrow("REDIRECT:/panel");
  });

  it("süper admin admin alanına girer", async () => {
    loggedInAs({
      id: "u1",
      role: "SUPER_ADMIN",
      businessId: null,
      permissions: [],
    });
    await expect(requireRole("SUPER_ADMIN")).resolves.toMatchObject({
      role: "SUPER_ADMIN",
    });
  });
});

describe("requireSession (panel)", () => {
  it("süper admin panele giremez, admin alanına yönlendirilir", async () => {
    loggedInAs({
      id: "u1",
      role: "SUPER_ADMIN",
      businessId: null,
      permissions: [],
    });
    await expect(requireSession()).rejects.toThrow("REDIRECT:/admin");
  });

  it("işletmesi olmayan kullanıcı panele giremez", async () => {
    loggedInAs({ id: "u1", role: "OWNER", businessId: null, permissions: [] });
    await expect(requireSession()).rejects.toThrow("REDIRECT:/login");
  });

  it("businessId'yi oturumdaki kullanıcının veritabanı kaydından alır", async () => {
    loggedInAs({
      id: "u1",
      role: "STAFF",
      businessId: "biz-1",
      permissions: [],
    });
    const { businessId } = await requireSession();
    expect(businessId).toBe("biz-1");
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      include: { permissions: true },
    });
  });
});
