import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

// TASLAK — köşeli parantezli alanlar doldurulmalı ve hukukçu onayı alınmalıdır.
export default function KvkkPage() {
  return (
    <LegalPage
      title="Kişisel Verilerin Korunması Aydınlatma Metni"
      updatedAt="[TARİH]"
    >
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”)
        uyarınca, veri sorumlusu sıfatıyla <strong>[ŞİRKET UNVANI]</strong> (“QR
        Menü”) tarafından hazırlanmıştır.
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
          menfaat (m. 5/2-f; örneğin hesap güvenliği).
        </li>
      </ul>

      <h2>3. Aktarım</h2>
      <p>
        Veriler; barındırma hizmeti sağlayıcısı ([VPS SAĞLAYICISI]), görsel
        depolama hizmeti (Cloudflare R2) ve e-posta gönderim hizmeti ([E-POSTA
        SAĞLAYICISI]) ile yalnızca hizmetin sunulması için gerekli ölçüde
        paylaşılır. [YURT DIŞINA AKTARIM DEĞERLENDİRMESİ — KVKK m. 9 kapsamında
        hukukçu ile netleştirilmelidir.]
      </p>

      <h2>4. Saklama süresi</h2>
      <p>
        Hesap verileri hesap açık olduğu sürece ve ardından ilgili mevzuatta
        öngörülen süreler boyunca saklanır; süre sonunda silinir, yok edilir
        veya anonim hale getirilir. [SÜRELER]
      </p>

      <h2>5. Haklarınız</h2>
      <p>
        KVKK m. 11 uyarınca kişisel verilerinizin işlenip işlenmediğini öğrenme,
        bilgi talep etme, düzeltilmesini veya silinmesini isteme, itiraz etme ve
        zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı{" "}
        <strong>[BAŞVURU E-POSTA ADRESİ]</strong> adresine veya{" "}
        <strong>[ŞİRKET ADRESİ]</strong> adresine yazılı olarak iletebilirsiniz.
      </p>

      <p className="text-sm text-stone-600 dark:text-stone-400">
        Veri sorumlusu: [ŞİRKET UNVANI] · MERSİS: [MERSİS NO] · Adres: [ŞİRKET
        ADRESİ] ·{" "}
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
