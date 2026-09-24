# QR Menü

Restoran ve kafeler için çok işletmeli QR menü platformu. Proje dokümanları: `proje-tanitimi.md`, `MIMARI.md`, `KURALLAR.md`, `FAZLAR.md` (NotebookLM).

## Yerel kurulum

Gerekenler: Node.js 20.9+, Docker.

```bash
cp .env.example .env          # BETTER_AUTH_SECRET için: openssl rand -base64 32
docker compose up -d          # PostgreSQL + Mailpit (e-posta) + S3Mock (görseller)
npm install                   # Prisma istemcisi de üretilir
npm run db:reset              # tabloları kurar + örnek veri (seed)
npm run dev                   # http://localhost:3000
```

## Komutlar

| Komut                | Ne yapar                                       |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Geliştirme sunucusu                            |
| `npm run build`      | Canlı derleme                                  |
| `npm start`          | Derlenmiş uygulamayı açar                      |
| `npm run typecheck`  | Tip kontrolü                                   |
| `npm run lint`       | ESLint                                         |
| `npm run format`     | Prettier ile biçimlendir                       |
| `npm run db:migrate` | Şema değişikliği → migration + istemci         |
| `npm run db:seed`    | Örnek verileri ekler                           |
| `npm run db:reset`   | Yerel veritabanını sıfırlar ve seed çalıştırır |

## E-posta

Şifre sıfırlama e-postaları SMTP ile gönderilir (`SMTP_*` değişkenleri). Yerelde Mailpit kullanılır: gönderilen e-postalar http://localhost:8025 adresinde görünür.

## Görseller

Görseller canlıda Cloudflare R2'de tutulur (`R2_*` değişkenleri). Yerelde R2 yerine S3 uyumlu S3Mock kullanılır (`R2_ENDPOINT=http://localhost:9090`).

## Örnek hesaplar (yalnızca yerel)

Şifre: `.env` içindeki `SEED_PASSWORD`.

- Süper admin: `admin@qrmenu.local`
- İşletme sahibi: `sahip@limonkafe.test`
- Çalışan: `calisan@limonkafe.test` (yalnızca tükendi işaretleme)

## Klasörler

`MIMARI.md` §3'teki yapı izlenir. Raporlar `raporlar/`, tasarım taslakları `tasarim/` altındadır.
