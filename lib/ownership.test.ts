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
