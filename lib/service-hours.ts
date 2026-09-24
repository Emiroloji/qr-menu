// Kategorinin görünme saatleri (Faz 2.4). Müşteri menüsünde de kullanıldığı için
// doğrulama kütüphanesine bağımlı değildir.

export type ServiceHours = { from: string; to: string };

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Türkiye saatiyle günün kaçıncı dakikası (Türkiye sabit UTC+3). */
export function istanbulMinutes(now: Date) {
  return (now.getUTCHours() * 60 + now.getUTCMinutes() + 180) % 1440;
}

/**
 * Şu an servis saatinde mi? Başlangıç dahil, bitiş hariç. Bitiş başlangıçtan küçükse
 * gece yarısını geçer (ör. 22:00–02:00).
 */
export function isWithinServiceHours(hours: ServiceHours, now: Date) {
  const current = istanbulMinutes(now);
  const from = toMinutes(hours.from);
  const to = toMinutes(hours.to);
  return from < to
    ? current >= from && current < to
    : current >= from || current < to;
}

/** "08:00–11:00" */
export const formatServiceHours = (hours: ServiceHours) =>
  `${hours.from}–${hours.to}`;
