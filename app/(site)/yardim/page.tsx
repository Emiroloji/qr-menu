import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Yardım merkezi",
  description:
    "QR Menü panelini kullanma rehberi: menü, QR kodlar, alerjen belgesi, çeviriler, kampanyalar ve daha fazlası.",
};

type Topic = { q: string; a: React.ReactNode };
type Section = { id: string; title: string; topics: Topic[] };

// Panel yolları kalın yazılır; kullanıcı ekranda aynı adı görür.
const P = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-site-ink">{children}</strong>
);

const SECTIONS: Section[] = [
  {
    id: "baslarken",
    title: "Başlarken",
    topics: [
      {
        q: "Hesabımı nasıl açarım?",
        a: (
          <>
            Hesapları biz açıyoruz.{" "}
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="underline underline-offset-4"
            >
              {COMPANY.supportEmail}
            </a>{" "}
            adresine işletme adınızı ve şube sayınızı yazın. Hesabınız açılınca
            e-postanıza gelen bağlantıyla şifrenizi belirleyip girersiniz.
          </>
        ),
      },
      {
        q: "Şifremi unuttum.",
        a: (
          <>
            Giriş ekranındaki <P>Şifremi unuttum</P> bağlantısına e-posta
            adresinizi yazın; yeni şifre belirleme bağlantısı gelir.
          </>
        ),
      },
      {
        q: "İlk olarak ne yapmalıyım?",
        a: (
          <>
            Sırasıyla: <P>Şubeler</P> ekranında şubenizin adresini, telefonunu,
            Wi-Fi bilgisini ve çalışma saatlerini girin; <P>Menü</P> ekranında
            kategorileri ve ürünleri ekleyin; <P>QR kodlar</P> ekranından masa
            kartını indirip bastırın.
          </>
        ),
      },
    ],
  },
  {
    id: "menu",
    title: "Menü",
    topics: [
      {
        q: "Ürün nasıl eklenir?",
        a: (
          <>
            <P>Menü</P> ekranında soldan kategoriyi seçin, <P>Ürün ekle</P>
            ’ye basın. Ad ve fiyat zorunlu; açıklama, alerjenler, etiketler ve
            besin değerleri isteğe bağlı. Görselleri ürünü kaydettikten sonra
            ekleyebilirsiniz.
          </>
        ),
      },
      {
        q: "Bir ürünün birden fazla boyu var (küçük, orta, büyük).",
        a: "Ürün formunda Boy ekle ile her boyun adını ve fiyatını girin. Menüde en düşük fiyat “’den” ile gösterilir, detayda tüm boylar listelenir.",
      },
      {
        q: "Biten bir ürünü nasıl işaretlerim?",
        a: (
          <>
            <P>Menü</P> ekranında ürünün yanındaki anahtarı kapatın. Ürün menüde
            “Tükendi” olarak görünür; tekrar açınca normale döner.
          </>
        ),
      },
      {
        q: "Tüm fiyatlara zam yapmak istiyorum.",
        a: (
          <>
            <P>Menü → Toplu fiyat</P> ile tüm menüye veya bir kategoriye yüzde
            ya da tutar olarak zam veya indirim uygulayın. Kaydetmeden önce
            örnek fiyat gösterilir.
          </>
        ),
      },
      {
        q: "Menümü Excel'den yükleyebilir miyim?",
        a: (
          <>
            Evet. <P>Menü → Excel → Menüyü indir</P> ile dosyayı indirin,
            düzenleyin ve aynı pencereden yükleyin. Aynı kategoride aynı adlı
            ürün güncellenir, yoksa eklenir; dosyada olmayan ürünler silinmez.
            Dosyadaki “Nasıl doldurulur” sayfası tüm kuralları anlatır.
          </>
        ),
      },
      {
        q: "Kahvaltı menüsü yalnızca sabah görünsün.",
        a: "Kategoriyi düzenleyip görünme saatlerini girin (ör. 08:00–11:00). Kategori menüde yalnızca bu saatlerde görünür ve “08:00–11:00 arası servis edilir” yazar.",
      },
      {
        q: "Menümü diğer şubeye nasıl kopyalarım?",
        a: (
          <>
            <P>Menü → Menüyü kopyala</P> ile bir şubenin kategori ve ürünlerini
            diğerine aktarın. Sonra fiyatları şubeye göre değiştirebilirsiniz.
          </>
        ),
      },
    ],
  },
  {
    id: "qr-belgeler",
    title: "QR kod ve belgeler",
    topics: [
      {
        q: "QR kodu nereden alırım?",
        a: (
          <>
            <P>QR kodlar</P> ekranından PNG veya SVG olarak ya da masa kartı,
            sticker ve A4 poster şablonuyla PDF olarak indirin. Her şubenin tek
            bir QR kodu vardır.
          </>
        ),
      },
      {
        q: "Menü değişince QR kodu yeniden bastırmam gerekir mi?",
        a: "Hayır. QR kod menünüzün adresini gösterir; menüdeki değişiklikler hemen görünür.",
      },
      {
        q: "Alerjen tablosu ve basılı menü",
        a: (
          <>
            <P>QR kodlar → Yasal belgeler</P> bölümünden tüm ürünlerin 14
            alerjenle tablosunu ve fiyatlı basılı menüyü PDF olarak indirin.
            Alerjen tablosunu müşterileriniz de menünün altından indirebilir.
          </>
        ),
      },
    ],
  },
  {
    id: "diller",
    title: "Diller ve görünüm",
    topics: [
      {
        q: "Menüye yabancı dil nasıl eklenir?",
        a: (
          <>
            <P>Şubeler</P> ekranında şubenin dillerini seçin (paketinize göre),
            sonra <P>Menü → Çeviriler</P> ekranında ürünlerin çevirisini girin.
            Çevirisi olmayan ürün Türkçe görünür; eksik çeviriler listelenir.
          </>
        ),
      },
      {
        q: "Menümün rengini ve temasını nasıl değiştiririm?",
        a: (
          <>
            <P>Görünüm</P> ekranında dört temadan birini ve ana rengi seçin;
            telefon önizlemesinde anında görürsünüz. Logo <P>Ayarlar</P>{" "}
            ekranından yüklenir.
          </>
        ),
      },
    ],
  },
  {
    id: "kampanyalar",
    title: "Kampanyalar",
    topics: [
      {
        q: "Kampanya banner'ı nasıl eklenir?",
        a: (
          <>
            <P>Kampanyalar → Yeni kampanya</P>: başlık, açıklama ve tarih
            aralığı girin, kaydettikten sonra görsel ekleyin. Kampanya tarih
            aralığında menünün en üstünde görünür.
          </>
        ),
      },
      {
        q: "Günün önerisi ve öne çıkan ürünler",
        a: "Kampanyalar ekranında bir güne bir ürün atayın (60 güne kadar önceden planlanabilir) ve en fazla 10 ürünü öne çıkarın. İkisi de menünün üstünde görünür.",
      },
    ],
  },
  {
    id: "calisanlar",
    title: "Çalışanlar ve istatistikler",
    topics: [
      {
        q: "Çalışan nasıl eklenir?",
        a: (
          <>
            <P>Çalışanlar → Çalışan ekle</P> ile ad ve e-posta girin, yetkileri
            seçin (ör. yalnızca tükendi işaretleme). Çalışana şifre belirleme
            e-postası gider. Çalışanlar şube, görünüm ve paket ayarlarını
            göremez.
          </>
        ),
      },
      {
        q: "Menüm kaç kez açıldı?",
        a: (
          <>
            <P>İstatistikler</P> ekranında günlük, haftalık ve aylık tarama
            sayılarını görürsünüz; paketinize göre yoğun saatler, dil dağılımı
            ve en çok bakılan ürünler de gösterilir. Müşterilerden kişisel veri
            toplanmaz.
          </>
        ),
      },
    ],
  },
  {
    id: "hesap",
    title: "Hesap ve paket",
    topics: [
      {
        q: "Kendi alan adımı kullanabilir miyim?",
        a: (
          <>
            Pro pakette <P>Ayarlar → Özel alan adı</P> bölümüne alan adınızı
            (ör. menu.isletmeniz.com) girin, gösterilen DNS kaydını ekleyin ve{" "}
            <P>DNS’i kontrol et</P>’e basın. Doğrulanınca menünüz ve QR
            kodlarınız bu adresi kullanır.
          </>
        ),
      },
      {
        q: "Aboneliğim bitince ne olur?",
        a: "Bitişe 7 gün kala panelde uyarı görünür ve e-posta gelir. Süre dolunca menünüz yayından kalkar, panel salt okunur olur; verileriniz silinmez. Uzatmak için bizimle iletişime geçin.",
      },
      {
        q: "Paketimi nasıl değiştiririm?",
        a: (
          <>
            <a
              href={`mailto:${COMPANY.supportEmail}`}
              className="underline underline-offset-4"
            >
              {COMPANY.supportEmail}
            </a>{" "}
            adresine yazın; paketinizi biz değiştiririz.
          </>
        ),
      },
    ],
  },
];

/** Yardım merkezi (FAZLAR 3.4): işletme sahipleri ve çalışanlar için. */
export default function HelpPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[14rem_1fr] md:py-16">
      <div className="flex flex-col gap-6 md:sticky md:top-8 md:self-start">
        <h1 className="font-site-display text-4xl">Yardım merkezi</h1>
        <nav aria-label="Konular">
          <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-full border border-site-line px-3 py-1.5 text-sm text-site-muted hover:border-site-ink hover:text-site-ink md:rounded-md md:border-0 md:px-0"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex max-w-3xl flex-col gap-12">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-baslik`}
            className="flex scroll-mt-8 flex-col gap-2"
          >
            <h2
              id={`${section.id}-baslik`}
              className="border-b-2 border-site-lemon pb-2 font-site-display text-2xl"
            >
              {section.title}
            </h2>
            {section.topics.map((topic) => (
              <details
                key={topic.q}
                className="group border-b border-site-line"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium marker:hidden">
                  {topic.q}
                  <span
                    aria-hidden
                    className="text-xl leading-none text-site-muted transition-transform group-open:rotate-45 motion-reduce:transition-none"
                  >
                    +
                  </span>
                </summary>
                <p className="pb-5 leading-relaxed text-site-muted">
                  {topic.a}
                </p>
              </details>
            ))}
          </section>
        ))}

        <p className="rounded-2xl bg-site-mist p-6 leading-relaxed">
          Aradığınızı bulamadınız mı?{" "}
          <a
            href={`mailto:${COMPANY.supportEmail}`}
            className="font-medium text-site-green underline underline-offset-4"
          >
            {COMPANY.supportEmail}
          </a>{" "}
          adresine yazın. Menünüzü kendiniz görmek için{" "}
          <Link href="/demo" className="underline underline-offset-4">
            örnek menüye
          </Link>{" "}
          bakabilirsiniz.
        </p>
      </div>
    </main>
  );
}
