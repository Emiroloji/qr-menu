# karefix Tanıtım Sitesi ve Sağlamlaştırma

## Ne yapıldı

**Tanıtım sitesi (app/(site), components/site)**

- Marka adı sitede "karefix"; işaret, karekodun köşe karesi. Başlık yazı tipi Bricolage
  Grotesque, gövde Onest.
- Ana ekran: limon sarısı alan ve "Menü değişir, karekod aynı kalır." Yanında dönen sahne
  (`HeroScene`): panelde üç değişiklik yapılır, telefondaki menü güncellenir, masadaki
  karekod değişmez. Karekod gerçektir (`QrArt`, `/demo` adresini gösterir) ve açılışta
  modül modül yerine oturur.
- "Dört adımda yayında" kareleri ekrana gelince sırayla dolar (`Steps`). Sık sorulanlar
  `details` ile açılır.
- Çalışan örnek menü ayrı bölümde (`LiveDemo`). Menü yüklenince kategori çubuğu için
  `scrollIntoView` çağırdığından dış sayfayı kaydırıyordu; çerçeve artık ancak ekrana
  gelince yükleniyor. Müşteri menüsünün koduna dokunulmadı.
- Hareketi azalt tercihi: sahne sabit son hâlini gösterir, CSS animasyonları kapanır.

**Sağlamlaştırma**

- Menü açılış kaydına hız sınırı: aynı IP ve şubeden 10 dakikada 120 (`RATE_LIMITS.scan`).
  Sınır aşılınca menü yine açılır, yalnızca kayıt yazılmaz.
- `zod` 4.6.6 (bellek tüketme uyarısı).
- Sunucu: SSH'ta şifreyle giriş kapatıldı, uygulama bellek sınırı 1 GB, gece yedekleri
  gizli R2 deposuna kopyalanıyor; geri yükleme denendi (`docs/YAYIN.md`).

## Doğrulama

- 161 birim testi, tip kontrolü, lint ve `next build` temiz.
- Yerelde derlenmiş uygulama: aynı IP'den 125 menü açılışının hepsi 200 döndü, 120'si
  kaydedildi; başka IP'den gelen açılış kaydedildi.
- Site masaüstü (1440) ve telefon (390) genişliğinde ekran görüntüsüyle incelendi; yatay
  taşma ve konsol hatası yok. Azaltılmış harekette hydration hatası giderildi.

## Bilinen sınırlar

- Ana ekrandaki karekod telefonla okutularak denenmedi (yerelde localhost'u gösterir).
- WebKit (Safari) ile otomatik deneme yapılmadı.
- Yasal metinler, e-postalar ve yönetim paneli hâlâ "QR Menü" adını kullanıyor.
