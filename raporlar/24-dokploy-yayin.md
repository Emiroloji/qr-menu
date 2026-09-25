# Dokploy ile Yayına Hazırlık

## Ne yapıldı

- `docker-compose.dokploy.yml`: Dokploy'da "Compose" olarak çalışacak canlı kurulum.
  Servisler: `qrmenu-db`, `qrmenu-migrate`, `qrmenu-app`, `qrmenu-cron`, `qrmenu-backup`.
- Caddy yok: aynı sunucudaki diğer projelerle birlikte 80/443'ü Dokploy'un Traefik'i tutuyor.
  Dışarıya port açılmıyor; alan adı Dokploy panelinde `qrmenu-app:3000`'e bağlanıyor.
- Servis adları `qrmenu-` ön ekli (Dokploy'un ortak ağında `db` gibi adlar çakışabilir).
- Her servise bellek sınırı (uygulama 512 MB, veritabanı 512 MB, yedek 128 MB, cron 32 MB).
- Gece yedeği sunucu crontab'ı yerine compose içindeki `qrmenu-backup` servisinde
  (`scripts/backup-db.sh` ile aynı kontroller: yarım yedek kalmaz, 14 günden eskiler silinir).
- `docs/YAYIN.md` başına "Dokploy ile" bölümü, `docs/KARARLAR.md`'ye üç karar.

## Kaynaktaki karşılığı

MIMARI §11 (barındırma "ileride VPS'e taşınabilir"); kullanıcı kararı: tek sunucuda Dokploy.

## Doğrulama (yerelde, Docker ile)

- Migration'lar uygulandı, `/api/health` → 200, seed ile süper admin oluştu.
- Tarayıcıda süper admin girişi → `/admin` İşletmeler ekranı, 5xx hata yok.
- `/`, `/demo`, `/yardim`, `/login` → 200.
- Cron ucu: yanlış anahtar 401, doğru anahtar 200 (`{"sent":0}`).
- Yedek servisi elle tetiklendi: `.sql.gz` oluştu, içinde 23 tablo.
- Bellek: uygulama ~200 MB, veritabanı ~45 MB.

## Açık kalanlar

- İşletmenin kendi alan adı için sertifika artık otomatik değil: alan adı Dokploy'a elle
  eklenir (KARARLAR). İlk Pro müşteri gelince otomatikleştirme yeniden değerlendirilir.
- GlitchTip bu dosyada yok; Dokploy şablonuyla ayrı proje olarak kurulacak.
- Yedeklerin sunucu dışına kopyası (R2) henüz yok.
- Alan adı yok: `sslip.io` adresiyle yayına çıkılacak, gerçek QR basılmayacak.
