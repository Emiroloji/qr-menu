// İşletmenin kendi alan adı (Faz 3.2). Saf fonksiyonlar: proxy.ts de kullanır, bu yüzden
// veritabanına veya sunucuya özel modüllere bağımlı değildir.

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** "HTTPS://Menu.Isletme.com/abc" → "menu.isletme.com". Geçersizse null. */
export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  if (host.length > 253 || IPV4.test(host)) return null;
  const labels = host.split(".");
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return null;
  // Üst düzey alan adı harflerden oluşur (.com, .com.tr, .cafe).
  if (!/^[a-z]{2,63}$/.test(labels.at(-1)!)) return null;
  return host;
}

/** Host başlığından port olmadan, küçük harfli alan adı. */
export function hostOf(header: string | null) {
  if (!header) return null;
  return header.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/** Platformun kendi adresi (NEXT_PUBLIC_APP_URL). */
export function platformHost(appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "") {
  try {
    return new URL(appUrl).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * İstek platformun kendisine mi? Platform adresi, IP adresleri ve noktasız adlar
 * (localhost, Docker içindeki "app") platformdur; geri kalan her alan adı işletmenindir.
 */
export function isPlatformHost(host: string, appHost = platformHost()) {
  return (
    host === appHost ||
    !host.includes(".") ||
    IPV4.test(host) ||
    host.startsWith("[")
  );
}

/** İşletme platformun kendi adresini veya alt alan adlarını kullanamaz. */
export function isPlatformDomain(domain: string, appHost = platformHost()) {
  return (
    Boolean(appHost) && (domain === appHost || domain.endsWith(`.${appHost}`))
  );
}
