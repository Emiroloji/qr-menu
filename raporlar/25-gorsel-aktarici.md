# Görseller Safari'de Görünmüyordu: Görsel Aktarıcı

## Sorun

Canlıda ürün ve kampanya görselleri Chrome'da görünüyor, Safari ve diğer tarayıcılarda
görünmüyordu.

## Sebep

Görseller tarayıcıya doğrudan Cloudflare R2'nin ücretsiz adresinden (`pub-….r2.dev`)
gidiyordu. Bu alan adı Türkiye'de erişim engelli:

- Düz HTTP isteği operatörün engel sayfasına yönleniyor (`Via: 1.0 middlebox`,
  `Location: http://88.255.216.16/landpage?...`).
- HTTPS bağlantısı TLS aşamasında kesiliyor.
- Aynı Cloudflare IP'sine başka alan adıyla gidilince 200 dönüyor: engel IP'ye değil,
  alan adına (SNI) göre.
- Sunucudan (VPS) aynı görsel sorunsuz geliyor.

Chrome alan adını şifrelediği (ECH) için engele takılmıyor; Safari takılıyor.
Logo ve kapak etkilenmiyordu: onlar `next/image` ile zaten sunucu üzerinden geliyor.

## Ne yapıldı

- `app/img/[...key]/route.ts`: `/img/{depo anahtarı}` isteğini R2'den alıp akış olarak
  iletir. Dosya sunucuda saklanmaz; tarayıcı 1 yıl önbellekte tutar. Yalnızca görsel
  türündeki içerik iletilir (SVG hariç), anahtar parçaları doğrulanır.
- `lib/product-image.ts`: `proxiedImageUrl` `r2.dev` adresini `/img/…` yoluna çevirir;
  `productImageSrc` bunu kullanır. Silme ve kopyalamada kullanılan `productImageFiles`
  ile yeni `productImageOriginal` asıl adresi döner.
- Kampanya düzenleme ekranındaki önizleme `next/image` ile sunucudan geldiği için asıl
  adresi (`productImageOriginal`) kullanır.
- `img` ayrılmış adreslere eklendi (işletme adresi olarak alınamaz).
- `docs/KARARLAR.md`'ye karar satırı.

Veritabanına ve R2'deki dosyalara dokunulmadı; kayıtlı adresler aynı kalır. Kod geri
alınırsa her şey eski haline döner.

## Doğrulama (yerelde)

- 160 birim testi geçti (4'ü yeni: adres çevirisi, depo adreslerinin çevrilmemesi).
- Tip kontrolü ve lint temiz, `next build` başarılı.
- Derlenmiş uygulama sahte bir depoyla çalıştırıldı: görsel bayt bayt aynı geldi,
  `cache-control: public, max-age=31536000, immutable`; farklı `Host` ile de 200;
  olmayan dosya ve HTML içerik 404; üst dizine çıkma denemeleri aktarıcıya ulaşmadı.
- Yerel bilgisayardan R2'ye erişilemediği için gerçek R2 ile uçtan uca deneme yayından
  sonra canlıda yapılır.

## Bilinen sınırlar

- Görsel ilk açılışta sunucu üzerinden geldiği için Cloudflare ağından gelmesine göre
  biraz daha yavaştır; sonraki açılışlarda tarayıcı önbelleği kullanılır.
- R2'ye özel alan adı bağlanırsa (`R2_PUBLIC_URL` `r2.dev` olmaktan çıkar) çeviri
  kendiliğinden devre dışı kalır; mevcut kayıtlardaki eski adresler için ayrıca karar gerekir.

## Ayrıca fark edilen

Proje klasörü iCloud ile eşitlenen Masaüstü'nde. iCloud, üretilmiş dosyaların " 2" adlı
kopyalarını oluşturup içeriğini buluta taşımış (`.next`, `lib/generated/prisma`,
`test-results`); tip kontrolü bu dosyaları okurken takılıyordu. Yeniden üretilebilen bu
kopyalar silindi. `scripts/demo-menu 2.ts` de aynı sebeple oluşmuş bir kopya.
