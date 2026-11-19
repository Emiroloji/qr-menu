# 27 — Uygulama belleği incelemesi

**Tarih:** 19 Kasım 2026

## Gözlem (canlı, salt okuma)

- qrmenu-app: yeniden başlatmadan 40 dk sonra 271 MB, 3,5 gün sonra 676 MB; aynı gün daha sonra 662 MB.
- Bellek uygulamanın kendi sürecinde (anonim bellek). Node'un yığın sınırı 1 GB konteynerde 524 MB.
- Uygulama hiç yeniden başlamadı; sunucuda bellek yetmezliği kaydı yok.

## Yerel deneme

Canlıyla aynı imaj, yerel veritabanı ve yerel depolama ile; 1 GB sınırla.

| Trafik                      | 3.000 istek başına bellek                             |
| --------------------------- | ----------------------------------------------------- |
| Menü sayfaları              | ısınmadan sonra sabit                                 |
| /img görsel aktarıcı        | ısınmadan sonra sabit                                 |
| Bot: Server Action denemesi | sabit                                                 |
| Bot: uydurma menü adresi    | +8–11 MB, ayrıca her adres diske bir önbellek dosyası |

Sebep: `getMenuLookup` (ve `getDomainSite`) bulunamayan adres için `null` sonucunu da
`unstable_cache` ile saklıyordu. 15.000 uydurma adreste diskte 21.000 dosya (85 MB) birikti.

## Değişiklik

- `lib/cache.ts`: `cacheFound` — `unstable_cache` gibi, ama `null` saklamaz.
- `lib/menu-data.ts` `getMenuLookup`, `lib/domains.ts` `getDomainSite` bunu kullanır.
- Sonuç (yerelde): 3.000 uydurma adres başına ~1 MB; 15.000 adreste diskte 8 dosya.
- `e2e/site.e2e.ts`: ana sayfa testi karefix başlığına güncellendi (26. adımda atlanmıştı).

Doğrulama: birim testleri 162/162, tip denetimi, uçtan uca 19/19.

## Sonuç ve açık konu

Canlıda 3,5 günde yalnızca 101 "bulunamadı" kaydı vardı. Bu yüzden düzeltme gerçek bir açığı
kapatsa da canlıdaki 400 MB'lık artışın ana sebebi bu değil. Bellek 676 → 662 MB'a
indiğinden artış V8'in yığını sınıra (524 MB) kadar kullanmasından kaynaklanıyor ve
burada duruyor olabilir. 2–3 gün sonra yeniden ölçülecek: 800 MB'ı geçerse gece
yeniden başlatma ya da yığın görüntüsüyle (heap snapshot) daha derin inceleme.
