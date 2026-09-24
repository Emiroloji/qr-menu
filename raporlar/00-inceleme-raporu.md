# Adım 0 — Proje İnceleme Raporu

**Tarih:** 2026-09-24
**Kaynak:** NotebookLM "qr menu" defteri (4 kaynak: proje-tanitimi.md, MIMARI.md, KURALLAR.md, FAZLAR.md)
**Yapılan:** Dört kaynak da ham metin olarak baştan sona okundu. Kod yazılmadı; proje klasörü boş.

---

## 1. Proje özeti (proje-tanitimi.md)

- Çok işletmeli (multi-tenant) **QR menü SaaS** platformu. Restoran, kafe, pastane, bar vb.
- **Yalnızca menü görüntüleme** — sipariş, sepet, ödeme yok.
- 4 kullanıcı tipi: **Platform yöneticisi (SUPER_ADMIN)**, **İşletme sahibi (OWNER)**, **Çalışan (STAFF)**, **Müşteri** (giriş yok, kişisel veri yok).
- Her şube için bir QR; menü değişince QR yeniden basılmaz.
- Öne çıkan özellikler: 14 yasal alerjen (içerir / iz miktarda), diyet etiketleri, besin değerleri, varyant fiyatları, çoklu dil, temalar, alerjen belgesi ve basılı menü PDF'i.
- Paketler (Başlangıç / Standart / Pro) şube, ürün, çalışan, dil, görünüm, istatistik limitlerine göre ayrışır; **veritabanında tutulur, koda gömülmez**.

## 2. Mimari (MIMARI.md)

- **Tek Next.js (App Router) uygulaması**, ayrı backend yok. Okuma: Server Component; yazma: Server Action.
- Üç yüz: müşteri menüsü `/{isletme}/{sube}`, işletme paneli `/panel/...`, süper admin `/admin/...`.
- Teknolojiler: TypeScript (strict), PostgreSQL (Neon), Prisma, Better Auth, Zod, Tailwind, shadcn/ui (sadece panel), Motion (sadece menü), Cloudflare R2, sharp, qrcode, @react-pdf/renderer, next-intl, Vercel.
- Klasör yapısı ve 17 veri modeli (Plan, Subscription, Business, Branch, Category, Product, ProductVariant, ProductImage, Nutrition, Allergen, ProductAllergen, Tag, ProductTag, User, StaffPermission, ScanLog) tanımlı.
- Fiyatlar **kuruş cinsinden Int**; çeviriler her modelde `translations` JSON alanında; yumuşak silme (`deletedAt`).
- Menü önbelleği `branch:{id}` etiketi + `revalidateTag`.
- Görsel akışı: 10 MB sınır → sharp ile 400/800/1200 px WebP → blur önizleme → R2.

## 3. Kurallar (KURALLAR.md) — kısaca

- Önce basit olan; "ileride lazım olur" diye kod yazılmaz; yetki/limit/fiyat biçimi tek fonksiyonda.
- Kod İngilizce, arayüz ve dokümanlar Türkçe; kebab-case dosya adları.
- `any` ve `@ts-ignore` yasak.
- Her Server Action sabit kalıp: oturum → yetki → doğrulama → sahiplik → paket limiti → işlem → revalidate; `ActionResult<T>` döner.
- Paneldeki her sorgu `businessId` ile sınırlı — **en kritik kural**.
- Performans hedefi: menü 4G'de < 1,5 sn, Lighthouse mobil ≥ 90, menü JS < 120 KB.
- Test: Vitest (yetki, limit, fiyat, izolasyon); Playwright Faz 2'den itibaren.
- Git: `main` her zaman çalışır, `feat/...` dalları, conventional commit, Prettier.

## 4. Yol haritası (FAZLAR.md)

| Faz | Hedef         | İçerik                                                       |
| --- | ------------- | ------------------------------------------------------------ |
| 0   | Hazırlık      | 0.1 Menü tasarımı · 0.2 Panel tasarımı · 0.3 Proje iskeleti  |
| 1   | MVP           | 1.1 Veritabanı → 1.11 Yayına hazırlık (11 adım)              |
| 2   | Geliştirmeler | Yasal PDF'ler, istatistik, kampanya, saate göre menü, kalite |
| 3   | Büyüme        | Kendi kaydı + online ödeme, özel alan adı, Excel, landing    |

**Kural:** Bir faz bitmeden sonrakine geçilmez. **Sıradaki adım: Faz 0.1 — Müşteri menüsü tasarımı.**

---

## 5. Kaynaklarda netleşmemiş noktalar (karar kullanıcıda)

Kaynakların dışına çıkmamak için bunları kendim seçmedim:

1. **Faz 0.1 / 0.2 tasarımları** nerede ve nasıl yapılacak? (Figma'da siz mi, yoksa HTML/önizleme olarak benim mi hazırlamamı istersiniz?) Renk ve yazı tipi kararları kaynakta yok.
2. **E-posta servisi yok.** Faz 1.2'de "şifre sıfırlama" ve Faz 2.5'te "e-posta uyarısı" var ama teknoloji tablosunda e-posta gönderim aracı belirtilmemiş.
3. **Sürükle-bırak sıralama** (Faz 1.5) için kütüphane belirtilmemiş.
4. **Giriş hız sınırı** (Faz 1.11) için araç belirtilmemiş (Better Auth'un kendi özelliği mi, ayrı bir çözüm mü?).
5. **Hata izleme** "Sentry vb." olarak geçiyor, kesin değil.
6. **Karanlık mod** müşteri menüsünde var, ama çerez kullanılmaması kuralı nedeniyle nasıl hatırlanacağı belirtilmemiş (telefonun sistem ayarı mı, URL parametresi mi?).
7. **Küçük tutarsızlıklar:**
   - Server Action sırası: KURALLAR'da "doğrulama → paket limiti", MIMARI'de "paket limiti → doğrulama". KURALLAR'daki kod örneğini esas almayı öneriyorum.
   - Yumuşak silme: KURALLAR'da kategori de dahil, MIMARI'de "işletme, şube ve ürünler". KURALLAR'daki (kategori dahil) daha kapsayıcı.
8. **Hesaplar/erişim (Faz 0.3 için gerekli):** Vercel hesabı, Neon veritabanı, Cloudflare R2 bucket bilgileri. Vercel CLI bilgisayarda kurulu değil. Klasör henüz git deposu değil.
