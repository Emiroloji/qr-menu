// Menüdeki sabit yazılar. Faz 1.10'da next-intl ile diğer dillere çevrilecek.
export const MENU_LABELS = {
  soldOut: "Tükendi",
  from: "’den",
  open: "Açık",
  closedToday: "Bugün kapalı",
  wifi: "Wi-Fi",
  address: "Adres",
  search: "Menüde ara",
  language: "Dil",
  badges: { CHEFS_CHOICE: "Şefin önerisi", NEW: "Yeni", POPULAR: "Popüler" },
  spice: "Acı",
  photoOf: (name: string) => `${name} fotoğrafı`,
  logoOf: (name: string) => `${name} logosu`,
  cover: "Kapak görseli",
};
export type MenuLabels = typeof MENU_LABELS;
