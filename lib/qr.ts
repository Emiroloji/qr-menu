import "server-only";
import QRCode from "qrcode";

/** Şubenin müşteri menüsü adresi (MIMARI §8): /{işletme}/{şube} */
export function menuUrl(businessSlug: string, branchSlug: string) {
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
