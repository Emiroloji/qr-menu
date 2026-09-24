// Renk yardımcıları: işletmenin seçtiği ana renk hangi tema zemininde olursa olsun
// okunaklı kalsın diye kontrast hesabı (WCAG). Hem sunucu hem istemci kullanır.

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: number[]) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** `amount` oranında beyaza (+) veya siyaha (−) karıştırır. */
export function mix(hex: string, amount: number) {
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  return toHex(rgb(hex).map((v) => v + (target - v) * t));
}

/** Rengin üzerine yazılacak metin: beyaz veya koyu, hangisi daha okunaklıysa. */
export function onColor(background: string) {
  return contrastRatio(background, "#FFFFFF") >=
    contrastRatio(background, "#111111")
    ? "#FFFFFF"
    : "#111111";
}

/**
 * Rengi, zemin üzerinde en az `min` kontrasta ulaşana kadar açar veya koyulaştırır.
 * Zemin koyuysa açar, açıksa koyulaştırır.
 */
export function readableOn(color: string, background: string, min = 4.5) {
  const direction = luminance(background) > 0.5 ? -1 : 1;
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(color, (direction * step) / 20);
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return direction < 0 ? "#111111" : "#FFFFFF";
}
