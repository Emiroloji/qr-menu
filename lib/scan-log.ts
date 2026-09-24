import "server-only";
import { db } from "@/lib/db";
import type { LanguageCode } from "@/lib/languages";

const BOT =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|lighthouse|headless/i;

export function deviceType(userAgent: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function isBot(userAgent: string) {
  return BOT.test(userAgent);
}

/** Menü açılışını kaydeder. IP adresi ve kişisel veri tutulmaz (MIMARI §8, KURALLAR 7). */
export async function recordScan(
  branchId: string,
  language: LanguageCode,
  userAgent: string,
) {
  if (isBot(userAgent)) return;
  await db.scanLog.create({
    data: { branchId, language, device: deviceType(userAgent) },
  });
}
