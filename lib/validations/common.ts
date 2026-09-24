import { z } from "zod";
import { parsePrice } from "@/lib/format";

export const id = z.string().min(1);

/** "YYYY-MM-DD" (`<input type="date">`) */
export const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seçin.");

/** TL cinsinden girilen fiyatı kuruşa çevirir. */
export const priceInput = z.string().transform((value, ctx) => {
  const kurus = parsePrice(value);
  if (kurus === null) {
    ctx.addIssue({
      code: "custom",
      message: "Geçerli bir fiyat girin (ör. 45,50).",
    });
    return z.NEVER;
  }
  return kurus;
});

/** Boş bırakılırsa null (= sınırsız), doluysa pozitif tam sayı. */
export const optionalLimit = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Limit 1 veya daha büyük bir tam sayı olmalı.",
      });
      return z.NEVER;
    }
    return n;
  });

/** HTML checkbox: işaretliyse "on" gelir, değilse hiç gelmez. */
export const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Girilen bilgiler geçersiz.";
}
