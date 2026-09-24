import { describe, expect, it } from "vitest";
import { deviceType, isBot } from "@/lib/scan-log";

describe("tarama kaydı", () => {
  it("cihaz türünü ayırt eder", () => {
    expect(
      deviceType(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
      ),
    ).toBe("mobile");
    expect(
      deviceType("Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari"),
    ).toBe("mobile");
    expect(deviceType("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)")).toBe(
      "tablet",
    );
    expect(deviceType("Mozilla/5.0 (Linux; Android 15; SM-X710) Safari")).toBe(
      "tablet",
    );
    expect(deviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0)")).toBe(
      "desktop",
    );
  });
  it("botları ve bağlantı önizlemelerini saymaz", () => {
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot("WhatsApp/2.24")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone) Mobile")).toBe(false);
  });
});
