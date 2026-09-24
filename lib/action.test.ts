import { describe, expect, it } from "vitest";
import { ActionError, toActionError } from "@/lib/action";

describe("toActionError", () => {
  it("beklenen hatayı kullanıcıya gösterilecek sonuca çevirir", () => {
    expect(toActionError(new ActionError("Limit doldu."))).toEqual({
      ok: false,
      error: "Limit doldu.",
    });
  });

  it("beklenmeyen hatayı yeniden fırlatır", () => {
    expect(() => toActionError(new Error("db bağlantısı koptu"))).toThrow(
      "db bağlantısı koptu",
    );
  });
});
