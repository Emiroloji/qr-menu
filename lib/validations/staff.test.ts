import { describe, expect, it } from "vitest";
import { newStaffSchema, staffSchema } from "@/lib/validations/staff";

describe("çalışan formu", () => {
  it("e-postayı küçük harfe çevirir, tekrarlanan yetkileri teke indirir", () => {
    expect(
      newStaffSchema.parse({
        name: " Deniz ",
        email: " Deniz@Limon.TEST ",
        permissions: ["PRODUCT_EDIT_PRICE", "PRODUCT_EDIT_PRICE"],
      }),
    ).toEqual({
      name: "Deniz",
      email: "deniz@limon.test",
      permissions: ["PRODUCT_EDIT_PRICE"],
    });
  });
  it("bilinmeyen yetkiyi reddeder", () => {
    expect(
      staffSchema.safeParse({ name: "X", permissions: ["SUPER_ADMIN"] })
        .success,
    ).toBe(false);
  });
  it("yetkisiz çalışana izin verir", () => {
    expect(
      staffSchema.parse({ name: "X", permissions: [] }).permissions,
    ).toEqual([]);
  });
});
