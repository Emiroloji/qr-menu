import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { branch: { findFirst } } }));

import { ActionError } from "@/lib/action";
import { assertBranchBelongsToBusiness } from "@/lib/ownership";

beforeEach(() => vi.resetAllMocks());

describe("assertBranchBelongsToBusiness (işletme izolasyonu)", () => {
  it("şubeyi hem id hem işletme ile arar, silinmişleri hariç tutar", async () => {
    findFirst.mockResolvedValue({ id: "br-1" });
    await assertBranchBelongsToBusiness("br-1", "biz-1");
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "br-1", businessId: "biz-1", deletedAt: null },
      select: { id: true },
    });
  });

  it("başka işletmenin şubesi için hata verir", async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      assertBranchBelongsToBusiness("br-baska", "biz-1"),
    ).rejects.toThrow(ActionError);
    await expect(
      assertBranchBelongsToBusiness("br-baska", "biz-1"),
    ).rejects.toThrow("Şube bulunamadı.");
  });
});

describe("kategori ve ürün sahipliği (işletme izolasyonu)", () => {
  it("kategoriyi şube üzerinden işletmeye bağlı arar", async () => {
    const { assertCategoryBelongsToBusiness } = await import("@/lib/ownership");
    const { db } = await import("@/lib/db");
    const category = vi.fn().mockResolvedValue({ id: "c1", branchId: "br-1" });
    (db as unknown as { category: { findFirst: typeof category } }).category = {
      findFirst: category,
    };
    await expect(
      assertCategoryBelongsToBusiness("c1", "biz-1"),
    ).resolves.toEqual({ id: "c1", branchId: "br-1" });
    expect(category.mock.calls[0][0].where).toEqual({
      id: "c1",
      deletedAt: null,
      branch: { businessId: "biz-1", deletedAt: null },
    });
    category.mockResolvedValue(null);
    await expect(
      assertCategoryBelongsToBusiness("c-baska", "biz-1"),
    ).rejects.toThrow("Kategori bulunamadı.");
  });

  it("ürünü kategori ve şube zinciriyle işletmeye bağlı arar", async () => {
    const { assertProductBelongsToBusiness } = await import("@/lib/ownership");
    const { db } = await import("@/lib/db");
    const product = vi.fn().mockResolvedValue({
      id: "p1",
      categoryId: "c1",
      category: { branchId: "br-1" },
    });
    (db as unknown as { product: { findFirst: typeof product } }).product = {
      findFirst: product,
    };
    await expect(
      assertProductBelongsToBusiness("p1", "biz-1"),
    ).resolves.toEqual({
      id: "p1",
      categoryId: "c1",
      branchId: "br-1",
    });
    expect(product.mock.calls[0][0].where).toEqual({
      id: "p1",
      deletedAt: null,
      category: {
        deletedAt: null,
        branch: { businessId: "biz-1", deletedAt: null },
      },
    });
    product.mockResolvedValue(null);
    await expect(
      assertProductBelongsToBusiness("p-baska", "biz-1"),
    ).rejects.toThrow("Ürün bulunamadı.");
  });
});

describe("çalışan sahipliği (işletme izolasyonu)", () => {
  it("yalnızca bu işletmenin STAFF rolündeki kullanıcısını kabul eder", async () => {
    const { assertStaffBelongsToBusiness } = await import("@/lib/ownership");
    const { db } = await import("@/lib/db");
    const findFirst = vi.fn().mockResolvedValue(null);
    (db as unknown as { user: { findFirst: typeof findFirst } }).user = {
      findFirst,
    };
    await expect(
      assertStaffBelongsToBusiness("u-sahip", "biz-1"),
    ).rejects.toThrow("Çalışan bulunamadı.");
    expect(findFirst.mock.calls[0][0].where).toEqual({
      id: "u-sahip",
      businessId: "biz-1",
      role: "STAFF",
    });
  });
});
