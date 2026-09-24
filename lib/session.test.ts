import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
  findBusiness: vi.fn(),
  findFirstBusiness: vi.fn(),
  cookie: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: mocks.cookie }),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.findUnique },
    business: {
      findUnique: mocks.findBusiness,
      findFirst: mocks.findFirstBusiness,
    },
  },
}));

import {
  requireOwnerSession,
  requireRole,
  requireSession,
  requireWritableSession,
} from "@/lib/session";

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

describe("işletmenin gözünden bak (süper admin)", () => {
  const admin = {
    id: "admin",
    role: "SUPER_ADMIN",
    businessId: null,
    permissions: [],
  };

  it("seçilen işletmenin panelini sahibi gibi açar", async () => {
    loggedInAs(admin);
    mocks.cookie.mockReturnValue({ value: "biz-9" });
    mocks.findFirstBusiness.mockResolvedValue({ id: "biz-9" });
    const session = await requireSession();
    expect(session).toMatchObject({
      businessId: "biz-9",
      viewOnly: true,
      user: { role: "OWNER", businessId: "biz-9" },
    });
    expect(mocks.findFirstBusiness).toHaveBeenCalledWith({
      where: { id: "biz-9", deletedAt: null },
      select: { id: true },
    });
  });

  it("görüntüleme modunda hiçbir değişikliğe izin vermez", async () => {
    loggedInAs(admin);
    mocks.cookie.mockReturnValue({ value: "biz-9" });
    mocks.findFirstBusiness.mockResolvedValue({ id: "biz-9" });
    await expect(requireWritableSession()).rejects.toThrow(
      "İşletmenin gözünden bakarken değişiklik yapılamaz.",
    );
  });

  it("silinmiş veya olmayan işletme için admin alanına döner", async () => {
    loggedInAs(admin);
    mocks.cookie.mockReturnValue({ value: "yok" });
    mocks.findFirstBusiness.mockResolvedValue(null);
    await expect(requireSession()).rejects.toThrow("REDIRECT:/admin");
  });

  it("çerez işletme sahibi veya çalışanın işletmesini değiştirmez", async () => {
    loggedInAs({
      id: "u1",
      role: "OWNER",
      businessId: "biz-1",
      permissions: [],
    });
    mocks.cookie.mockReturnValue({ value: "biz-9" });
    const session = await requireSession();
    expect(session).toMatchObject({ businessId: "biz-1", viewOnly: false });
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
});

describe("requireOwnerSession", () => {
  it("çalışanı özete yönlendirir", async () => {
    loggedInAs({
      id: "u1",
      role: "STAFF",
      businessId: "biz-1",
      permissions: [],
    });
    await expect(requireOwnerSession()).rejects.toThrow("REDIRECT:/panel");
  });
});

describe("requireWritableSession (salt okunur panel)", () => {
  const day = 24 * 60 * 60 * 1000;
  const subscription = (status = "ACTIVE") => ({
    status,
    startsAt: new Date(Date.now() - day),
    endsAt: new Date(Date.now() + 30 * day),
    plan: {},
  });
  const owner = {
    id: "u1",
    role: "OWNER",
    businessId: "biz-1",
    permissions: [],
  };

  it("aktif işletmede geçer ve işletmeyi oturumdaki businessId ile arar", async () => {
    loggedInAs(owner);
    mocks.findBusiness.mockResolvedValue({
      id: "biz-1",
      isActive: true,
      subscriptions: [subscription()],
    });
    await expect(requireWritableSession()).resolves.toMatchObject({
      businessId: "biz-1",
      status: "ACTIVE",
    });
    expect(mocks.findBusiness.mock.calls[0][0].where).toEqual({
      id: "biz-1",
      deletedAt: null,
    });
  });

  it("pasif işletmede değişikliğe izin vermez", async () => {
    loggedInAs(owner);
    mocks.findBusiness.mockResolvedValue({
      id: "biz-1",
      isActive: false,
      subscriptions: [subscription()],
    });
    await expect(requireWritableSession()).rejects.toThrow(
      "İşletmeniz pasif durumda.",
    );
  });

  it("askıya alınmış veya süresi dolmuş abonelikte değişikliğe izin vermez", async () => {
    loggedInAs(owner);
    mocks.findBusiness.mockResolvedValue({
      id: "biz-1",
      isActive: true,
      subscriptions: [subscription("SUSPENDED")],
    });
    await expect(requireWritableSession()).rejects.toThrow(
      "Aboneliğiniz askıya alındı.",
    );
    mocks.findBusiness.mockResolvedValue({
      id: "biz-1",
      isActive: true,
      subscriptions: [],
    });
    await expect(requireWritableSession()).rejects.toThrow(
      "Aboneliğiniz sona erdi.",
    );
  });
});
