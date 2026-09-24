#!/usr/bin/env bash
# Canlı veritabanı yedeği: sıkıştırılmış pg_dump, eski yedekleri siler, isteğe bağlı uzak kopya.
# Kullanım (VPS'te, proje klasöründe): ./scripts/backup-db.sh
# Zamanlama örneği (her gece 03:30): docs/YAYIN.md
#
# Ortam değişkenleri (isteğe bağlı):
#   BACKUP_DIR=./backups          yedeklerin yazılacağı klasör
#   KEEP_DAYS=14                  bu günden eski yedekler silinir
#   BACKUP_RCLONE_REMOTE=r2:yedek rclone ile sunucu dışına kopya (önerilir)
set -euo pipefail
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
file="$BACKUP_DIR/qrmenu-$(date +%Y%m%d-%H%M%S).sql.gz"

docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip > "$file.tmp"

# Yarım veya boş yedek kalmasın.
if ! gzip -t "$file.tmp" || ! gzip -dc "$file.tmp" | grep -q "PostgreSQL database dump complete"; then
  rm -f "$file.tmp"
  echo "Yedek alınamadı." >&2
  exit 1
fi
mv "$file.tmp" "$file"

find "$BACKUP_DIR" -name 'qrmenu-*.sql.gz' -mtime +"$KEEP_DAYS" -delete

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  rclone copy "$file" "$BACKUP_RCLONE_REMOTE"
fi

echo "Yedek alındı: $file ($(du -h "$file" | cut -f1))"
