/**
 * E-postanın göndereni: adres SMTP_FROM'dan ("Ad <adres>" ya da yalnızca adres), görünen
 * ad her zaman platformun adı. Böylece marka değişince ortam değişkenine dokunmak gerekmez.
 */
export function senderAddress(from: string | undefined, brand: string) {
  const value = from?.trim();
  if (!value) return undefined;
  const address = /<([^>]+)>/.exec(value)?.[1]?.trim() ?? value;
  return { name: brand, address };
}
