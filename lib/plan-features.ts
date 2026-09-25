import { ActionError } from "@/lib/action";
import { type PlanFeatures, planFeaturesSchema } from "@/lib/validations/plan";

const NONE: PlanFeatures = {
  appearance: "PRESET",
  stats: "NONE",
  customDomain: false,
};

export function readPlanFeatures(value: unknown): PlanFeatures {
  return planFeaturesSchema.safeParse(value).data ?? NONE;
}

// Görünüm (proje-tanitimi.md, paket tablosu):
// Başlangıç "Hazır tema" · Standart "Logo ve renkler" · Pro "Tam özelleştirme"

/** Logo ve ana renk: Standart ve üstü */
export const canUseBranding = (f: PlanFeatures) => f.appearance !== "PRESET";
/** Kapak görseli: Pro */
export const canUseCover = (f: PlanFeatures) => f.appearance === "FULL";
/** Kendi alan adı (Faz 3.2): paket ayarındaki "Özel alan adı" */
export const canUseCustomDomain = (f: PlanFeatures) => f.customDomain;

export function assertFeature(allowed: boolean) {
  if (!allowed)
    throw new ActionError(
      "Paketiniz bu özelliği içermiyor. Paket yükseltmek için bizimle iletişime geçin.",
    );
}
