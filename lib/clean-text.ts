/**
 * Kullanıcı metnini temizler: görünmez denetim karakterlerini (ör. Excel'den gelen 0x00)
 * atar. PostgreSQL 0x00'ı kabul etmez; biri bile olsa kayıt hata verir.
 * Satır sonu ve sekme korunur.
 */
export function cleanText(text: string) {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
