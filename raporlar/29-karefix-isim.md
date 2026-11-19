# 29 — Platform adı: QR Menü → karefix

**Tarih:** 19 Kasım 2026 · **Dal:** `feat/karefix-isim` (commitlenmedi, canlıya gönderilmedi)

## Ne yapıldı

- Marka adı tek yerde: `COMPANY.brand` (`lib/company.ts`). Yasal metinler, yasal sayfa
  başlığı, yönetim paneli başlığı, hesap ve hatırlatma e-postaları ve Excel dosyasının
  "oluşturan" bilgisi buradan okur.
- E-postanın görünen gönderen adı koddan gelir (`lib/mail-from.ts`); adres `SMTP_FROM`'dan
  alınmaya devam eder. Dokploy'daki ortam değişkenine dokunmak gerekmez.
- Hesap ve hatırlatma e-postalarının sonuna "karefix" imzası.
- Giriş, şifre sıfırlama sayfalarının üstüne "karefix" (ana sayfaya bağlantı).
- Yasal metinlerin "Son güncelleme" tarihi 19 Kasım 2026 (KVKK'ya değerlendirme
  paragrafı eklendiği için).
- Örnek ortam dosyaları ve Dockerfile açıklaması.

Müşteri menüsüne, veritabanına ve URL'lere dokunulmadı. "QR menü" ifadesinin ürün türü
olarak geçtiği yerler (tanıtım metinleri) bırakıldı.

## Doğrulama (yerel)

Birim testleri 175/175, tip denetimi, ESLint, Prettier temiz; uçtan uca 21/21. Yerel
e-posta kutusunda şifre sıfırlama e-postası: gönderen "karefix", imza "karefix".
