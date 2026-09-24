import { z } from "zod";
import { slug } from "@/lib/validations/business";

export const DAYS = [
  ["mon", "Pazartesi"],
  ["tue", "Salı"],
  ["wed", "Çarşamba"],
  ["thu", "Perşembe"],
  ["fri", "Cuma"],
  ["sat", "Cumartesi"],
  ["sun", "Pazar"],
] as const;
export type Day = (typeof DAYS)[number][0];

/** { mon: [["08:00", "23:00"]], sun: [] } — boş dizi: kapalı. Kapanış açılıştan küçükse gece yarısını geçer. */
export type OpeningHours = Partial<Record<Day, [string, string][]>>;

export const SOCIALS = [
  ["instagram", "Instagram", "https://instagram.com/"],
  ["facebook", "Facebook", "https://facebook.com/"],
  ["tiktok", "TikTok", "https://tiktok.com/@"],
  ["x", "X (Twitter)", "https://x.com/"],
  ["website", "Web sitesi", "https://"],
] as const;
export type SocialKey = (typeof SOCIALS)[number][0];
export type Socials = Partial<Record<SocialKey, string>>;

/** "@limonkafe", "limonkafe" veya tam adres → tam adres. */
export function normalizeSocial(key: SocialKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const prefix = SOCIALS.find(([k]) => k === key)![2];
  return key === "website"
    ? `${prefix}${trimmed}`
    : `${prefix}${trimmed.replace(/^@/, "")}`;
}

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saatleri SS:DD biçiminde girin.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const branchSchema = z
  .looseObject({
    name: z.string().trim().min(1, "Şube adı girin.").max(100),
    slug,
    address: optionalText(300),
    phone: optionalText(30),
    wifi: optionalText(100),
  })
  .transform((data, ctx) => {
    const raw = data as Record<string, unknown>;
    const text = (key: string) =>
      typeof raw[key] === "string" ? (raw[key] as string) : "";

    const openingHours: OpeningHours = {};
    for (const [day, label] of DAYS) {
      if (text(`${day}_open`) !== "on") {
        openingHours[day] = [];
        continue;
      }
      const from = time.safeParse(text(`${day}_from`));
      const to = time.safeParse(text(`${day}_to`));
      if (!from.success || !to.success) {
        ctx.addIssue({
          code: "custom",
          message: `${label}: açılış ve kapanış saatini girin.`,
        });
        return z.NEVER;
      }
      openingHours[day] = [[from.data, to.data]];
    }

    const socials: Socials = {};
    for (const [key] of SOCIALS) {
      const url = normalizeSocial(key, text(key));
      if (url) socials[key] = url;
    }

    return {
      name: data.name,
      slug: data.slug,
      address: data.address,
      phone: data.phone,
      wifi: data.wifi,
      openingHours,
      socials,
    };
  });

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1, "İşletme adı girin.").max(100),
});
