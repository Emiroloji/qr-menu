# QR Menü

Restoran ve kafeler için çok işletmeli QR menü platformu. Proje dokümanları: `proje-tanitimi.md`, `MIMARI.md`, `KURALLAR.md`, `FAZLAR.md` (NotebookLM).

## Yerel kurulum

Gerekenler: Node.js 20.9+, Docker.

```bash
cp .env.example .env          # BETTER_AUTH_SECRET için: openssl rand -base64 32
docker compose up -d          # PostgreSQL
npm install                   # Prisma istemcisi de üretilir
npx prisma migrate dev        # tabloları oluşturur
npm run dev                   # http://localhost:3000
```

## Komutlar

| Komut                    | Ne yapar                     |
| ------------------------ | ---------------------------- |
| `npm run dev`            | Geliştirme sunucusu          |
| `npm run build`          | Canlı derleme                |
| `npm start`              | Derlenmiş uygulamayı açar    |
| `npm run typecheck`      | Tip kontrolü                 |
| `npm run lint`           | ESLint                       |
| `npm run format`         | Prettier ile biçimlendir     |
| `npx prisma migrate dev` | Şema değişikliği → migration |

## Klasörler

`MIMARI.md` §3'teki yapı izlenir. Raporlar `raporlar/`, tasarım taslakları `tasarim/` altındadır.
