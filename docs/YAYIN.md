# Canlıya Alma (VPS)

Uygulama tek bir VPS'te Docker ile çalışır: **PostgreSQL + uygulama (Next.js) + Caddy (HTTPS)**.
Görseller Cloudflare R2'de, e-postalar SMTP ile gönderilir.

## 1. Gerekenler

- Ubuntu 24.04 (veya benzeri) VPS · en az 2 GB RAM, 2 vCPU, **40 GB disk** (imajlar ve yedekler için)
- Docker Engine ve Docker Compose eklentisi
- Alan adı ve **A kaydı** → VPS IP adresi (ör. `menu.ornek.com`) — alan adı yoksa bkz. 2a
- Cloudflare R2 bucket'ı ve herkese açık adresi (`R2_PUBLIC_URL`)
- SMTP hesabı (şifre belirleme / sıfırlama e-postaları)
- Güvenlik duvarı: yalnızca 22 (SSH), 80, 443 ve (hata izleme için) 8000 açık

## 2. İlk kurulum

```bash
git clone <depo-adresi> qr-menu && cd qr-menu
cp .env.production.example .env.production   # tüm alanları doldurun
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
# Süper admin hesabı, 14 alerjen, etiketler ve varsayılan paketler (bir kez):
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm \
  -e NODE_ENV=production migrate npx prisma db seed
```

- Caddy, alan adı için SSL sertifikasını **otomatik** alır ve yeniler; HTTP isteklerini HTTPS'e yönlendirir.
- Migration'lar her başlatmada `migrate` servisiyle uygulanır; uygulama bu adım bitmeden açılmaz.
- Kontrol: `curl https://menu.ornek.com/api/health` → `{"ok":true}`
- Seed'den sonra `.env.production` içindeki `SEED_PASSWORD`'ü silin ve admin olarak giriş yapıp
  "Şifremi unuttum" ile şifreyi değiştirin.
- Paket fiyatlarını süper admin panelinden (Paketler) girin.

> `NEXT_PUBLIC_APP_URL` derleme sırasında koda gömülür ve **basılı QR kodların adresidir**.
> Canlıya almadan önce doğru alan adıyla doldurun; sonradan değiştirmek QR'ları geçersiz kılar.

## 2a. Alan adı olmadan (geçici, IP adresiyle)

`.env.production` içinde:

```
DOMAIN=:80
NEXT_PUBLIC_APP_URL=http://<SUNUCU_IP>
BETTER_AUTH_URL=http://<SUNUCU_IP>
```

- Uygulama `http://<SUNUCU_IP>` adresinde HTTPS olmadan çalışır (yerelde denendi: giriş, panel, menü).
- **Alan adı gelmeden QR kod bastırmayın:** QR'lar `NEXT_PUBLIC_APP_URL` adresini içerir;
  alan adı geldiğinde bu üç değeri güncelleyip `up -d --build` ile yeniden derleyin.
- Şifre gibi bilgiler HTTPS olmadan şifrelenmeden gider; bu mod yalnızca deneme içindir.

## 3. Güncelleme

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Güncellemeden önce yedek alın (aşağıda).

## 4. Yedekleme

```bash
./scripts/backup-db.sh          # backups/qrmenu-YYYYMMDD-HHMMSS.sql.gz
```

Her gece 03:30'da otomatik yedek (`crontab -e`):

```
30 3 * * * cd /home/deploy/qr-menu && ./scripts/backup-db.sh >> backups/yedek.log 2>&1
```

- 14 günden eski yedekler silinir (`KEEP_DAYS` ile değiştirilebilir).
- **Sunucu dışı kopya önerilir:** [rclone](https://rclone.org) ile bir uzak tanımlayıp
  `BACKUP_RCLONE_REMOTE=r2:qrmenu-yedek` verin (R2'de ayrı ve herkese kapalı bir bucket).
- Geri yükleme (mevcut veriyi siler, onay ister): `./scripts/restore-db.sh backups/<dosya>.sql.gz`

## 5. Kayıtlar ve hata izleme (GlitchTip — ücretsiz, kendi sunucumuzda)

- Uygulama kayıtları: `docker compose -f docker-compose.prod.yml logs -f app`
- Sunucu hataları her zaman tek satırlık JSON olarak yazılır (`instrumentation.ts`).
- **GlitchTip** (Sentry uyumlu, açık kaynak) aynı sunucuda `monitoring` profiliyle çalışır
  (~250 MB bellek). Kurulum:

```bash
# .env.production: GLITCHTIP_SECRET_KEY, GLITCHTIP_DB_PASSWORD, GLITCHTIP_DOMAIN doldurun
docker compose -f docker-compose.prod.yml --env-file .env.production --profile monitoring up -d
# İlk yönetici hesabı:
docker compose -f docker-compose.prod.yml --env-file .env.production exec glitchtip \
  ./manage.py createsuperuser
```

1. `http://<SUNUCU_IP>:8000` adresinde giriş yapın, bir kuruluş ve "Next.js" projesi oluşturun.
2. Projenin DSN'ini `.env.production` içine `SENTRY_DSN` olarak yazın; adresin ana makinesini
   `glitchtip:8000` yapın (ör. `http://ANAHTAR@glitchtip:8000/1`).
3. `docker compose ... up -d app` ile uygulamayı yeniden başlatın.

- Gönderilen hatalarda çerez, başlık, IP, sorgu parametresi ve kullanıcı bilgisi **yoktur**
  (yerelde denendi). Hatalar 30 gün sonra silinir.
- Tarayıcıya hata izleme kodu yüklenmez; müşteri menüsünün hızı etkilenmez.
- Sonraki güncellemelerde tüm servisler için `--profile monitoring` eklemeyi unutmayın.

## 6. Güvenlik notları

- Uygulama ve veritabanı dışarıya açık değildir; yalnızca Caddy 80/443'ü dinler.
- Giriş denemeleri sınırlıdır (aynı hesaba 15 dakikada 8, aynı IP'den 30 deneme).
- Derleme sonrası eski imajlar yer kaplar: ara sıra `docker image prune -f` ve `docker builder prune -f`.
- `.env.production` depoya girmez; yetkisiz erişime karşı `chmod 600 .env.production`.
- Sunucuyu düzenli güncelleyin (`unattended-upgrades` önerilir).
