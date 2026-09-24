import { describe, expect, it } from "vitest";
import { ActionError } from "@/lib/action";
import {
  hasPermission,
  homePathFor,
  requirePermission,
} from "@/lib/permissions";

const owner = { role: "OWNER" as const, permissions: [] };
const staff = {
  role: "STAFF" as const,
  permissions: [{ permission: "PRODUCT_TOGGLE_AVAILABILITY" as const }],
};
const superAdmin = { role: "SUPER_ADMIN" as const, permissions: [] };

describe("homePathFor", () => {
  it("süper admini /admin'e, diğerlerini /panel'e yönlendirir", () => {
    expect(homePathFor("SUPER_ADMIN")).toBe("/admin");
    expect(homePathFor("OWNER")).toBe("/panel");
    expect(homePathFor("STAFF")).toBe("/panel");
  });
});

describe("hasPermission", () => {
  it("işletme sahibi her yetkiye sahiptir", () => {
    expect(hasPermission(owner, "PRODUCT_EDIT")).toBe(true);
    expect(hasPermission(owner, "CATEGORY_EDIT")).toBe(true);
  });

  it("çalışan yalnızca verilen yetkiye sahiptir", () => {
    expect(hasPermission(staff, "PRODUCT_TOGGLE_AVAILABILITY")).toBe(true);
    expect(hasPermission(staff, "PRODUCT_EDIT_PRICE")).toBe(false);
    expect(hasPermission(staff, "PRODUCT_EDIT")).toBe(false);
  });

  it("süper admin işletme paneli yetkilerine sahip değildir", () => {
    expect(hasPermission(superAdmin, "PRODUCT_EDIT")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("yetki yoksa kullanıcıya gösterilebilir bir hata fırlatır", async () => {
    await expect(requirePermission(staff, "PRODUCT_EDIT")).rejects.toThrow(
      ActionError,
    );
    await expect(requirePermission(staff, "PRODUCT_EDIT")).rejects.toThrow(
      "Bu işlem için yetkiniz yok.",
    );
  });

  it("yetki varsa geçer", async () => {
    await expect(
      requirePermission(staff, "PRODUCT_TOGGLE_AVAILABILITY"),
    ).resolves.toBeUndefined();
  });
});
