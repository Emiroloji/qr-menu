import { z } from "zod";
import { dateInput, id } from "@/lib/validations/common";

/** İşletme slug'ı olarak kullanılamayan adresler (MIMARI §8). */
export const RESERVED_SLUGS = [
  "panel",
  "admin",
  "login",
  "api",
  "forgot-password",
  "reset-password",
];

export const slug = z
  .string()
  .trim()
  .min(2, "Adres en az 2 karakter olmalı.")
  .max(60)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Adres yalnızca küçük harf, rakam ve tire içerebilir.",
  )
  .refine(
    (s) => !RESERVED_SLUGS.includes(s),
    "Bu adres sistem tarafından kullanılıyor.",
  );

export const subscriptionPeriodSchema = z
  .object({
    planId: id,
    startsAt: dateInput,
    endsAt: dateInput,
  })
  .refine((d) => d.endsAt >= d.startsAt, {
    message: "Bitiş tarihi başlangıçtan önce olamaz.",
    path: ["endsAt"],
  });

export const createBusinessSchema = z
  .object({
    name: z.string().trim().min(1, "İşletme adı girin.").max(100),
    slug,
    ownerName: z.string().trim().min(1, "Sahibin adını girin.").max(100),
    ownerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Geçerli bir e-posta adresi girin.")),
  })
  .and(subscriptionPeriodSchema);

export const startSubscriptionSchema = z
  .object({ businessId: id })
  .and(subscriptionPeriodSchema);

export const extendSubscriptionSchema = z.object({
  subscriptionId: id,
  endsAt: dateInput,
});
