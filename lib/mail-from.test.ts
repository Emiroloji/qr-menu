import { describe, expect, it } from "vitest";
import { senderAddress } from "@/lib/mail-from";

describe("gönderen adresi", () => {
  it("ad ve adres biçiminden adresi alır, adı markayla değiştirir", () => {
    expect(senderAddress("QR Menü <info@ornek.com>", "karefix")).toEqual({
      name: "karefix",
      address: "info@ornek.com",
    });
  });
  it("yalnızca adres verilmişse de çalışır", () => {
    expect(senderAddress("info@ornek.com", "karefix")).toEqual({
      name: "karefix",
      address: "info@ornek.com",
    });
  });
  it("tanımlı değilse undefined döner", () => {
    expect(senderAddress(undefined, "karefix")).toBeUndefined();
    expect(senderAddress("  ", "karefix")).toBeUndefined();
  });
});
