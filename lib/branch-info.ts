// Şube bilgilerinin (çalışma saati, sosyal medya) yapısı. Doğrulama kütüphanesine (zod)
// bağımlı değildir; müşteri menüsünün istemci koduna da girer, bu yüzden hafif tutulur.

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
