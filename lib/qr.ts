import "server-only";
import QRCode from "qrcode";

/**
 * Şubenin müşteri menüsü adresi (MIMARI §8): /{işletme}/{şube}. İşletmenin doğrulanmış
 * kendi alan adı varsa (Faz 3.2, `activeCustomDomain`) https://{alan-adı}/{şube}.
 */
export function menuUrl(
  businessSlug: string,
  branchSlug: string,
  customDomain?: string | null,
) {
  if (customDomain) return `https://${customDomain}/${branchSlug}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base}/${businessSlug}/${branchSlug}`;
}

// "M" düzeyi hata düzeltme: basılı kodun küçük çizik ve lekelerde okunmasını sağlar.
const OPTIONS = { errorCorrectionLevel: "M", margin: 2 } as const;

export function qrSvg(url: string) {
  return QRCode.toString(url, { ...OPTIONS, type: "svg" });
}

export function qrPng(url: string, width = 1024) {
  return QRCode.toBuffer(url, { ...OPTIONS, type: "png", width });
}
