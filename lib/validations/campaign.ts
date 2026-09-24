import { z } from "zod";
import { checkbox, dateInput, id } from "@/lib/validations/common";

export const campaignSchema = z
  .object({
    title: z.string().trim().min(1, "Kampanya başlığını girin.").max(80),
    description: z
      .string()
      .trim()
      .max(200, "Açıklama en fazla 200 karakter olabilir.")
      .optional()
      .transform((v) => v || null),
    startsAt: dateInput,
    endsAt: dateInput,
    isActive: checkbox,
  })
  .refine((c) => c.endsAt >= c.startsAt, {
    message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    path: ["endsAt"],
  });

export const dailySpecialSchema = z.object({
  branchId: id,
  productId: id,
  date: dateInput,
});

export const featuredSchema = z.object({
  productId: id,
  isFeatured: z.boolean(),
});
