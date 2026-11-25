# 30 — Yönetim sayfalarında yetki açığı

**Tarih:** 25 Kasım 2026

## Bulgu

Yönetim (`app/(admin)`) sayfalarında yetki yalnızca `layout.tsx` içinde denetleniyordu.
Next.js istemci gezintisinde (RSC isteği, `Next-Router-State-Tree` başlığı) paylaşılan
layout'u yeniden çalıştırmaz. Başlık elle hazırlanınca sayfa layout'suz çalıştı ve
girişsiz bir istek ya da işletme sahibi; işletme listesini, sahip e-postalarını,
abonelikleri ve paketleri alabildi. Yerelde kanıtlandı; canlıda gerçek veri döneceği
için denenmedi.

Yalnızca okuma açığıydı: tüm Server Action'lar kendi yetki kontrolünü yapıyor.

## Düzeltme

8 yönetim sayfasına `await requireRole("SUPER_ADMIN")` eklendi (Next.js
kimlik doğrulama rehberi, "Layouts and auth checks"). Panel sayfaları zaten kendi
kontrolünü yapıyordu.

## Denetlenen ve temiz çıkanlar

- Panel işlemleri: ürün, kategori, kampanya, çalışan, şube, çeviri, Excel,
  değerlendirme — hepsi `assert…BelongsToBusiness` ile işletme izolasyonlu.
- API uçları: QR, PDF, Excel, yükleme, cron, alan adı, görsel aktarıcı.
- Müşteri menüsü verisi yalnızca görünür kayıtları ve herkese açık şube bilgisini taşır.
- Depoda gizli anahtar yok; istemciye yalnızca `NEXT_PUBLIC_APP_URL` gider.

## Test

- `e2e/admin-guard.e2e.ts`: girişsiz ve işletme sahibi gezinti isteğiyle yönetim
  sayfasından veri alamaz.
- tsc, lint, 175 birim testi, 27 uçtan uca test geçti.
