import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  subscription: { findFirst: vi.fn() },
  branch: { count: vi.fn() },
  product: { count: vi.fn() },
  user: { count: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db }));

import { ActionError } from "@/lib/action";
import { assertPlanLimit, isWithinLimit } from "@/lib/plan-limits";

const plan = { maxBranches: 3, maxProducts: 300, maxStaff: 5, maxLanguages: 2 };

beforeEach(() => {
  vi.resetAllMocks();
  db.subscription.findFirst.mockResolvedValue({ plan });
});

describe("isWithinLimit", () => {
  it("null limit sınırsızdır", () => {
    expect(isWithinLimit(null, 10_000)).toBe(true);
  });
  it("limite eşit olmak serbesttir, aşmak değildir", () => {
    expect(isWithinLimit(3, 3)).toBe(true);
    expect(isWithinLimit(3, 4)).toBe(false);
  });
});

describe("assertPlanLimit", () => {
  it("aktif abonelik yoksa hata verir", async () => {
    db.subscription.findFirst.mockResolvedValue(null);
    await expect(assertPlanLimit("biz-1", "branches")).rejects.toThrow(
      "Aktif bir aboneliğiniz yok.",
    );
  });

  it("limit altındaysa geçer", async () => {
    db.branch.count.mockResolvedValue(2);
    await expect(assertPlanLimit("biz-1", "branches")).resolves.toBeUndefined();
  });

  it("limit doluysa yeni kayda izin vermez", async () => {
    db.branch.count.mockResolvedValue(3);
    await expect(assertPlanLimit("biz-1", "branches")).rejects.toThrow(
      ActionError,
    );
  });

  it("sınırsız pakette limit uygulanmaz", async () => {
    db.subscription.findFirst.mockResolvedValue({
      plan: { ...plan, maxProducts: null },
    });
    db.product.count.mockResolvedValue(99_999);
    await expect(assertPlanLimit("biz-1", "products")).resolves.toBeUndefined();
  });

  it("dil limitini şubenin seçtiği toplam dil sayısıyla kontrol eder", async () => {
    await expect(
      assertPlanLimit("biz-1", "languages", { languageCount: 2 }),
    ).resolves.toBeUndefined();
    await expect(
      assertPlanLimit("biz-1", "languages", { languageCount: 3 }),
    ).rejects.toThrow("Paketiniz bu kadar dil seçeneğine izin vermiyor.");
  });

  it("yalnızca kendi işletmesinin, silinmemiş kayıtlarını sayar", async () => {
    db.product.count.mockResolvedValue(0);
    await assertPlanLimit("biz-1", "products");
    expect(db.product.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        category: {
          deletedAt: null,
          branch: { businessId: "biz-1", deletedAt: null },
        },
      },
    });

    db.user.count.mockResolvedValue(0);
    await assertPlanLimit("biz-1", "staff");
    expect(db.user.count).toHaveBeenCalledWith({
      where: { businessId: "biz-1", role: "STAFF" },
    });
  });

  it("aboneliği işletmeye göre ve yalnızca geçerli tarih aralığında arar", async () => {
    db.branch.count.mockResolvedValue(0);
    await assertPlanLimit("biz-1", "branches");
    const where = db.subscription.findFirst.mock.calls[0][0].where;
    expect(where.businessId).toBe("biz-1");
    expect(where.status).toBe("ACTIVE");
  });
});
