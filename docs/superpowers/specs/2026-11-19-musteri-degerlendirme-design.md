# Müşteri değerlendirmeleri — tasarım

**Tarih:** 19 Kasım 2026 · **Durum:** kullanıcı onayladı (sohbette)

## Amaç

Müşteri QR menüden işletmeye 1–5 yıldız ve isteğe bağlı kısa bir mesaj bırakır; işletme
sahibi bunları kendi panelinde görür. Özellik NotebookLM kaynaklarında yoktur; karar
`docs/KARARLAR.md`'ye yazılır.

## Kısıtlar (kaynaklardan)

- Müşteriden kişisel veri istenmez; menüde çerez, IP veya kişisel veri toplanmaz
  (KURALLAR 7, 13; proje-tanitimi "Müşteri"). → Değerlendirme anonimdir; IP yalnızca hız
  sınırı için bellekte kullanılır, saklanmaz.
- Müşteri menüsü kutsaldır; menü JS'i < 120 KB, menüde shadcn yok (KURALLAR 1, 8, 9).
  → Form `components/menu/` altında, yalnızca butona basınca yüklenir.
- Paket özellikleri koda gömülmez (KURALLAR 13). → Paket ayarı (`features.feedback`).
- **Canlı veri:** mevcut tablolara ve satırlara dokunulmaz. Migration yalnızca yeni tablo
  ekler (CREATE TABLE + index + FK). `Plan.features` JSON'una yeni anahtar migration
  gerektirmez; eksik anahtar `false` okunur.

## Veri

```prisma
model Feedback {
  id        String    @id @default(cuid())
  branchId  String
  branch    Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  rating    Int       // 1–5
  message   String?   // en fazla 500 karakter, denetim karakterleri atılmış
  language  String    // menünün açık olduğu dil
  createdAt DateTime  @default(now())
  readAt    DateTime?

  @@index([branchId, createdAt])
}
```

`Branch`'e yalnızca Prisma ilişki alanı (`feedbacks Feedback[]`) eklenir; bu veritabanında
sütun oluşturmaz.

`planFeaturesSchema`'ya `feedback: z.boolean().default(false)`; `canUseFeedback(f)`.

## Akış

**Menü.** `MenuData`'ya `feedback: boolean` (paketten). `MENU_DATA_VERSION` 3 → 4 (önbellek
anahtarı değişir; eski önbellek kayıtları kullanılmaz, kendiliğinden düşer). `true` ise
menü altbilgisinde ve bilgi panelinde "Bizi değerlendirin" butonu. Butona basınca form
`next/dynamic` ile yüklenir; mevcut `sheet` bileşeninde açılır: 5 yıldız (zorunlu), mesaj
(isteğe bağlı, 500), "Kişisel bilgi yazmayın" notu, Gönder; başarıda teşekkür. Metinler
`messages/*.json`'a (tr, en, de, ar, ru) eklenir.

**Gönderim.** `actions/feedback.ts` → `submitFeedback(input)`, oturumsuz:

1. Zod: `branchId`, `rating` 1–5 tam sayı, `message` ≤ 500 (cleanCell ile temizlenir,
   boşsa null), `lang` geçerli dil kodu.
2. Bot user-agent ise reddet; hız sınırı `feedback:{ip}:{branchId}` 5 / saat
   (`RATE_LIMITS.feedback`).
3. Şube silinmemiş; işletme aktif, abonelik geçerli (menü yayında) ve paket
   `feedback` içeriyor — önbellek değil, veritabanı sorgusu.
4. Yaz; `{ ok: true }` ya da kullanıcıya gösterilecek kısa hata.

**Panel.** `/panel/feedback` "Değerlendirmeler", yalnızca sahip (`requireOwnerSession`):

- Paket izin vermiyorsa istatistik sayfasındaki gibi kilit kartı.
- Şube seçici (birden çok şube varsa), ortalama puan + yıldız dağılımı, en yeniden eskiye
  liste (puan, mesaj, tarih, şube, dil), 50'lik sayfalama.
- Sayfa açılınca görüntülenen okunmamışlar `readAt` alır.
- Silme: `deleteFeedback(id)` — sahiplik `branch.businessId` ile doğrulanır.
- Panel menüsünde "Değerlendirmeler" ve okunmamış sayısı rozeti.

**Yönetim.** Paket formuna "Müşteri değerlendirmeleri" kutusu. `savePlan` paketi kullanan
işletmelerin menü önbelleğini yeniler (`expireBusinessMenus`), böylece buton hemen
görünür/kaybolur.

## Hata durumları

- Hız sınırı: "Çok fazla değerlendirme gönderildi, daha sonra deneyin."
- Paket/menü kapalı: "Değerlendirme şu an alınamıyor."
- Ağ hatası: form açık kalır, yeniden denenebilir.

## KVKK

Aydınlatma metnine: değerlendirmeler anonimdir, IP saklanmaz; mesaj serbest metindir,
kişisel bilgi yazılmaması istenir; işletme sahibi görür ve silebilir; şube silinirse
değerlendirmeler de silinir. (Metin hâlâ hukukçu onayı bekliyor.)

## Test

- Birim: Zod şeması (puan sınırları, mesaj kırpma/temizleme), `canUseFeedback`,
  hız sınırı kuralı.
- Uçtan uca: paket izinliyken menüden gönder → panelde gör → okundu → sil; izinsizken
  buton yok ve panelde kilit.
- Menü JS bütçesi: derleme çıktısında menü sayfasının ilk yükü değişmemeli.

## Kapsam dışı (ilk sürüm)

Sahibin cevap yazması, e-posta bildirimi, menüde herkese açık yorumlar, çalışan yetkisi,
otomatik silme süresi.

## Yayın

Yerelde test → kullanıcıya push onayı sorulur (canlıya yeni tablo eklenecek). Bellek
ölçümünden (21–22.11) sonra önbellek düzeltmesiyle birlikte. Deploy öncesi taze yedek
alınır ve R2'ye kopyalanır.
