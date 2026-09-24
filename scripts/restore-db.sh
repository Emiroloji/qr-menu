#!/usr/bin/env bash
# Yedeği geri yükler. DİKKAT: mevcut veritabanının içeriği silinir.
# Kullanım: ./scripts/restore-db.sh backups/qrmenu-20260924-033000.sql.gz
set -euo pipefail
cd "$(dirname "$0")/.."

file="${1:?Kullanım: ./scripts/restore-db.sh <yedek.sql.gz>}"
[ -f "$file" ] || { echo "Dosya bulunamadı: $file" >&2; exit 1; }
read -r -p "Canlı veritabanı silinip $file yüklenecek. Devam etmek için EVET yazın: " answer
[ "$answer" = "EVET" ] || { echo "İptal edildi."; exit 1; }

compose() { docker compose -f docker-compose.prod.yml --env-file .env.production "$@"; }
compose stop app
compose exec -T db sh -c 'dropdb -U "$POSTGRES_USER" --force "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
gzip -dc "$file" | compose exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
compose start app
echo "Geri yükleme tamamlandı."
