export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };

/** Beklenen hata: mesajı Türkçedir ve kullanıcıya gösterilebilir. */
export class ActionError extends Error {}

/**
 * Server Action'ların catch bloğunda kullanılır. Beklenen hatalar sonuca çevrilir,
 * beklenmeyenler (ve Next.js'in redirect'i) yeniden fırlatılır.
 */
export function toActionError(error: unknown): { ok: false; error: string } {
  if (error instanceof ActionError) return { ok: false, error: error.message };
  throw error;
}
