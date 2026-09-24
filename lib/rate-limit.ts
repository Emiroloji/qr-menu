// Sabit pencereli hız sınırı (bellekte). Tek sunuculu VPS kurulumu için yeterli;
// birden fazla sunucuya geçilirse paylaşılan bir depoya (Redis vb.) taşınmalıdır.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitRule = { limit: number; windowMs: number };

/** İzin verilirse true döner ve sayacı artırır. */
export function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
) {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (bucket.count >= rule.limit) return false;
  bucket.count++;
  return true;
}

const MINUTE = 60_000;
export const RATE_LIMITS = {
  /** Aynı IP'den giriş denemesi */
  signInIp: { limit: 30, windowMs: 15 * MINUTE },
  /** Aynı hesaba giriş denemesi (şifre tahminine karşı) */
  signInEmail: { limit: 8, windowMs: 15 * MINUTE },
  /** Şifre sıfırlama e-postası isteği */
  resetIp: { limit: 5, windowMs: 15 * MINUTE },
  resetEmail: { limit: 3, windowMs: 60 * MINUTE },
  /** Menüde ürün detayı açılışı kaydı (istatistikleri şişirmeye karşı) */
  productView: { limit: 60, windowMs: 10 * MINUTE },
} satisfies Record<string, RateLimitRule>;

/** Ters vekil (Caddy) arkasında istemci IP'si; doğrudan erişimde "unknown". */
export function clientIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
