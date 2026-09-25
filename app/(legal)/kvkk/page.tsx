import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

// Metin yayından önce hukukçuya onaylatılmalıdır; şirket bilgileri lib/company.ts'te.
export default function KvkkPage() {
  return (
    <LegalPage title="Kişisel Verilerin Korunması Aydınlatma Metni">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
        uyarınca, veri sorumlusu sıfatıyla <strong>{COMPANY.legalName}</strong>{" "}
        (“QR Menü”) tarafından hazırlanmıştır.
      </p>

      <h2>1. Menüyü görüntüleyen ziyaretçiler</h2>
      <p>
        QR kod ile menüye ulaşan ziyaretçilerden{" "}
        <strong>hiçbir kişisel veri istenmez</strong>. Üyelik gerekmez; menüde
        çerez kullanılmaz ve IP adresi saklanmaz. Menünün kaç kez açıldığını
        ölçmek için yalnızca kimliği belirsiz bilgiler (açılış zamanı, seçilen
        dil ve cihaz türü: telefon, tablet veya bilgisayar) kaydedilir. Bu
        bilgiler bir kişiyle ilişkilendirilemez.
      </p>

      <h2>2. Panel kullanıcıları (işletme sahipleri ve çalışanlar)</h2>
      <ul>
        <li>
          <strong>İşlenen veriler:</strong> ad soyad, e-posta adresi, şifrenin
          geri döndürülemez özeti, oturum bilgileri (oturum çerezi, oturum
          açılan tarayıcı bilgisi ve IP adresi) ve işletmeye ait menü
          içerikleri.
        </li>
        <li>
          <strong>Amaç:</strong> hesabın açılması ve yönetimi, panele güvenli
          giriş, şifre belirleme ve sıfırlama e-postalarının gönderilmesi,
          hizmet sözleşmesinin ifası.
        </li>
        <li>
          <strong>Hukuki sebep:</strong> sözleşmenin kurulması ve ifası (KVKK m.
          5/2-c), veri sorumlusunun hukuki yükümlülüğü (m. 5/2-ç) ve meşru
          menfaat (m. 5/2-f; örneğin hesap güvenliği ve hataların giderilmesi).
        </li>
      </ul>

      <h2>3. Aktarım</h2>
      <p>
        Veriler; sunucu hizmeti sağlayıcısı ({COMPANY.hostingProvider}), e-posta
        gönderim hizmeti ({COMPANY.emailProvider}) ve görsel depolama hizmeti
        (Cloudflare R2) ile yalnızca hizmetin sunulması için gerekli ölçüde
        paylaşılır. E-posta gönderim ve görsel depolama hizmetlerinin altyapısı
        yurt dışında bulunabildiğinden, bu kapsamdaki aktarım KVKK m. 9 uyarınca
        Kurul tarafından ilan edilen standart sözleşme ile ve bu maddedeki
        usullere uygun olarak yapılır. E-posta hizmetine yalnızca alıcının adı
        ve e-posta adresi ile e-postanın içeriği iletilir; ürün görselleri
        kişisel veri içermez.
      </p>
      <p>
        Uygulama hataları, kişisel veri içermeyecek şekilde (çerez, başlık, IP
        adresi ve kullanıcı bilgisi çıkarılarak) yalnızca kendi sunucumuzda
        çalışan hata izleme sisteminde tutulur ve 30 gün sonra silinir.
      </p>

      <h2>4. Saklama süresi</h2>
      <p>
        Hesap verileri, hesap açık olduğu sürece ve hesabın kapanmasından sonra
        ilgili mevzuatta öngörülen zamanaşımı süreleri boyunca (genel olarak 10
        yıl) saklanır. Oturum kayıtları en geç 7 gün, anonim menü açılış
        sayıları en fazla 2 yıl tutulur. Süre sonunda veriler silinir, yok
        edilir veya anonim hale getirilir.
      </p>

      <h2>5. Haklarınız</h2>
      <p>
        KVKK m. 11 uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme,
        bilgi talep etme, işlenme amacını öğrenme, aktarıldığı üçüncü kişileri
        bilme, eksik veya yanlış işlenmişse düzeltilmesini, silinmesini veya yok
        edilmesini isteme, itiraz etme ve zararın giderilmesini talep etme
        haklarına sahipsiniz. Başvurularınızı{" "}
        <a
          href={`mailto:${COMPANY.kvkkEmail}`}
          className="underline underline-offset-4"
        >
          {COMPANY.kvkkEmail}
        </a>{" "}
        adresine veya {COMPANY.address} adresine yazılı olarak iletebilirsiniz.
        Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
      </p>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        Veri sorumlusu: {COMPANY.legalName} · MERSİS: {COMPANY.mersis} · Adres:{" "}
        {COMPANY.address} ·{" "}
        <Link
          href="/kullanim-kosullari"
          className="underline underline-offset-4"
        >
          Kullanım koşulları
        </Link>
      </p>
    </LegalPage>
  );
}
