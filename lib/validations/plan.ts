import { z } from "zod";
import { checkbox, optionalLimit, priceInput } from "@/lib/validations/common";

export const APPEARANCE_OPTIONS = {
  PRESET: "Hazır tema",
  BRANDING: "Logo ve renkler",
  FULL: "Tam özelleştirme",
} as const;

export const STATS_OPTIONS = {
  NONE: "Yok",
  BASIC: "Temel",
  DETAILED: "Detaylı",
} as const;

/** Plan.features JSON alanının şekli. */
export const planFeaturesSchema = z.object({
  appearance: z.enum(
    Object.keys(APPEARANCE_OPTIONS) as [keyof typeof APPEARANCE_OPTIONS],
  ),
  stats: z.enum(Object.keys(STATS_OPTIONS) as [keyof typeof STATS_OPTIONS]),
  customDomain: z.boolean().default(false),
});
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;

export const planSchema = z
  .object({
    name: z.string().trim().min(1, "Paket adı girin.").max(60),
    price: priceInput,
    maxBranches: optionalLimit,
    maxProducts: optionalLimit,
    maxStaff: optionalLimit,
    maxLanguages: optionalLimit,
    appearance: planFeaturesSchema.shape.appearance,
    stats: planFeaturesSchema.shape.stats,
    customDomain: checkbox,
    isActive: checkbox,
  })
  .transform(({ appearance, stats, customDomain, ...plan }) => ({
    ...plan,
    features: { appearance, stats, customDomain } satisfies PlanFeatures,
  }));
