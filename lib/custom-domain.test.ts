import { describe, expect, it } from "vitest";
import {
  hostOf,
  isPlatformDomain,
  isPlatformHost,
  normalizeDomain,
} from "@/lib/custom-domain";

describe("alan adı biçimi", () => {
  it("adres, protokol ve büyük harf yazılsa da alan adını çıkarır", () => {
    expect(normalizeDomain(" HTTPS://Menu.Isletme.com/kadikoy ")).toBe(
      "menu.isletme.com",
    );
    expect(normalizeDomain("menu.kafe.com.tr.")).toBe("menu.kafe.com.tr");
    expect(normalizeDomain("menu.isletme.com:443")).toBe("menu.isletme.com");
  });
  it("geçersiz alan adlarını reddeder", () => {
    expect(normalizeDomain("isletme")).toBeNull();
    expect(normalizeDomain("192.168.1.10")).toBeNull();
    expect(normalizeDomain("-menu.isletme.com")).toBeNull();
    expect(normalizeDomain("menu..isletme.com")).toBeNull();
    expect(normalizeDomain("menu.isletme.123")).toBeNull();
    expect(normalizeDomain("menü.isletme.com")).toBeNull();
  });
});

describe("platform adresi", () => {
  const app = "qrmenu.com";
  it("platformun kendisini, IP'leri ve iç adları ayırt eder", () => {
    expect(isPlatformHost("qrmenu.com", app)).toBe(true);
    expect(isPlatformHost("localhost", app)).toBe(true);
    expect(isPlatformHost("app", app)).toBe(true);
    expect(isPlatformHost("203.0.113.5", app)).toBe(true);
    expect(isPlatformHost("menu.isletme.com", app)).toBe(false);
  });
  it("host başlığından portu atar", () => {
    expect(hostOf("Menu.Isletme.com:443")).toBe("menu.isletme.com");
    expect(hostOf(null)).toBeNull();
  });
  it("işletme platformun alan adını ve alt alan adlarını alamaz", () => {
    expect(isPlatformDomain("qrmenu.com", app)).toBe(true);
    expect(isPlatformDomain("admin.qrmenu.com", app)).toBe(true);
    expect(isPlatformDomain("menu.isletme.com", app)).toBe(false);
    expect(isPlatformDomain("menu.isletme.com", "")).toBe(false);
  });
});
