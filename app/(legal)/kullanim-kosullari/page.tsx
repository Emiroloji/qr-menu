import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "Kullanım Koşulları" };

// Metin yayından önce hukukçuya onaylatılmalıdır; şirket bilgileri lib/company.ts'te.
export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Koşulları">
      <p>
        Bu koşullar, {COMPANY.legalName} (“QR Menü”) tarafından sunulan dijital
        menü hizmetinin işletmeler tarafından kullanımını düzenler.
      </p>

      <h2>1. Hizmet</h2>
      <p>
        QR Menü, işletmelerin menülerini dijital ortamda yayınlamasını sağlar.
        Hizmet yalnızca menü görüntüleme içindir; sipariş ve ödeme alınmaz.
      </p>

      <h2>2. Hesaplar</h2>
      <ul>
        <li>
          Hesaplar QR Menü tarafından açılır; giriş bilgilerinin gizliliğinden
          hesap sahibi sorumludur.
        </li>
        <li>
          İşletme sahibi, çalışanlarına verdiği yetkilerden ve onların
          işlemlerinden sorumludur.
        </li>
      </ul>

      <h2>3. İçerik ve sorumluluk</h2>
      <ul>
        <li>
          Menüdeki ürün, fiyat, <strong>alerjen</strong>, besin değeri ve diğer
          bilgilerin doğruluğu ve güncelliğinden işletme sorumludur. QR Menü bu
          bilgileri yalnızca işletmenin girdiği şekliyle gösterir.
        </li>
        <li>
          Yüklenen görsel ve metinlerin telif ve diğer haklarının işletmeye ait
          olduğu veya kullanım izninin alındığı kabul edilir.
        </li>
        <li>
          Yasalara aykırı içerik yayınlanamaz; bu durumda içerik kaldırılabilir
          veya hesap askıya alınabilir.
        </li>
      </ul>

      <h2>4. Paketler ve abonelik</h2>
      <p>
        Hizmet, seçilen paketin limitleri ve özellikleriyle sunulur. Abonelik
        süresi dolduğunda menü yayından kalkar ve panel salt okunur olur.
        Abonelik ücreti, seçilen paket ve süre için peşin olarak ödenir; bitiş
        tarihinden 7 gün önce panelde hatırlatma yapılır. Süresi dolan abonelik
        yenilenmezse işletme verileri silinmez; yenilendiğinde menü yeniden
        yayına girer.
      </p>

      <h2>5. Değişiklikler ve iletişim</h2>
      <p>
        QR Menü bu koşulları güncelleyebilir; güncel metin bu sayfada
        yayınlanır. İletişim:{" "}
        <a
          href={`mailto:${COMPANY.supportEmail}`}
          className="underline underline-offset-4"
        >
          {COMPANY.supportEmail}
        </a>
        .
      </p>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        <Link href="/kvkk" className="underline underline-offset-4">
          KVKK aydınlatma metni
        </Link>
      </p>
    </LegalPage>
  );
}
