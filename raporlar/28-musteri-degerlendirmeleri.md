# 28 — Müşteri değerlendirmeleri

**Tarih:** 19 Kasım 2026 · **Dal:** `feat/musteri-degerlendirme` (canlıya gönderilmedi)

Tasarım: `docs/superpowers/specs/2026-11-19-musteri-degerlendirme-design.md`
Plan: `docs/superpowers/plans/2026-11-19-musteri-degerlendirme.md`

## Kaynaktaki karşılığı

NotebookLM kaynaklarında yok; kullanıcı isteği. KURALLAR 7 ve 13 (müşteriden kişisel veri
istenmez, IP saklanmaz) ve menü performansı kuralları korundu. Karar `docs/KARARLAR.md`'de.

## Ne yapıldı

- **Paket ayarı:** `features.feedback` (varsayılan kapalı), yönetimde "Müşteri
  değerlendirmeleri" kutusu. Paket kaydedilince o paketteki işletmelerin menü önbelleği
  yenilenir (önceden paket değişikliği menüye 1 saate kadar geç yansıyordu).
- **Menü:** paket izin veriyorsa altta ve bilgi panelinde "Bizi değerlendirin". Form
  (1–5 yıldız, isteğe bağlı 500 karakter mesaj, "kişisel bilgi yazmayın" notu) butona
  basınca yüklenir. 5 dilde. `MENU_DATA_VERSION` 3 → 4.
- **Gönderim:** `actions/feedback.ts`, oturumsuz. Zod doğrulaması, denetim karakteri
  temizliği, bot süzgeci, IP+şube başına saatte 5. Şube yayında ve paket izinli olmalı
  (önbellek değil veritabanı sorgulanır). IP saklanmaz.
- **Panel:** `/panel/feedback` (yalnızca sahip): ortalama, yıldız dağılımı, liste, şube
  seçimi, sayfalama, silme; görüntülenince okundu; menüde okunmamış sayısı. Yönetici
  "işletmenin gözünden bak" modunda okundu işaretlenmez, silemez.
- **KVKK:** ziyaretçi bölümüne anonim değerlendirme paragrafı.
- Metin temizleyici `lib/clean-text.ts`'e taşındı (Excel içe aktarma da kullanıyor).

## Veritabanı değişikliği

`prisma/migrations/20261119103745_feedback/migration.sql` yalnızca:

```sql
CREATE TABLE "Feedback" (…);
CREATE INDEX "Feedback_branchId_createdAt_idx" ON "Feedback"("branchId", "createdAt");
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

Mevcut tablolarda değişiklik, silme veya güncelleme yok. Canlıda paket ayarı kapalı
geldiği için yayından sonra hiçbir menüde buton çıkmaz; yönetici paketi işaretleyince açılır.

## Doğrulama (yerel)

- Birim testleri: 172/172. Tip denetimi, ESLint, Prettier temiz.
- Uçtan uca: 21/21 (yeni: paket kapalıyken buton ve panel öğesi yok; menüden gönder →
  panelde gör → sil).
- Tarayıcıda telefon boyutunda menü ve panel ekran görüntüleriyle kontrol edildi.
- Form kodu menünün ilk yükünde değil (ayrı parça).

## Notlar

- Next.js 16.4.3 için npm'de iki orta seviye güvenlik kaydı var (GHSA-mfr8-8qww-v76h,
  GHSA-vc7v-qv4w-wrv8; düzeltme 16.4.6). İkisi de `'use cache'` / root params ile ilgili;
  projede bu özellikler kullanılmıyor. Yükseltme ayrı bir iş olarak değerlendirilmeli.
- Next.js derlemesi bir yapay zekâ ajanı tarafından çalıştırılınca bu kayıt yüzünden çıkış
  kodu 1 veriyor (`next/dist/lib/upgrade/nudge.js`); Dokploy'daki derlemeyi etkilemez.

## Yayın

Kullanıcı onayı ile, bellek ölçümünden (21–22.11) sonra, önbellek düzeltmesiyle birlikte.
Deploy öncesi canlı veritabanının taze yedeği alınıp R2'ye kopyalanır.
