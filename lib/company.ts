// Veri sorumlusu ve hizmet sağlayıcı bilgileri (KVKK aydınlatma metni, kullanım koşulları).
// Veri sorumlusu gerçek kişidir (şirket yok); bu yüzden MERSİS ve vergi bilgisi yoktur.
// Metinler henüz bir hukukçuya onaylatılmadı.

type Company = {
  /** true iken yasal sayfalarda "örnek bilgiler" uyarısı gösterilir. */
  isExample: boolean;
  legalName: string;
  /** Yazılı başvuru adresi; boşsa metinde yalnızca e-posta gösterilir. */
  address?: string;
  kvkkEmail: string;
  /** Hesap talepleri, destek ve bildirim e-postalarının adresi (Gmail SMTP ile gönderilir). */
  supportEmail: string;
  /** Sanal sunucu (VPS) sağlayıcısı ve sunucunun bulunduğu ülke */
  hostingProvider: string;
  emailProvider: string;
  updatedAt: string;
};

export const COMPANY: Company = {
  isExample: false,
  legalName: "Emir Uysal",
  kvkkEmail: "emircanuysal6e@gmail.com",
  supportEmail: "emircanuysal6e@gmail.com",
  hostingProvider:
    "Hosting Dünyam Bilgi İletişim Teknolojileri Ticaret Ltd. Şti. (Türkiye)",
  emailProvider: "Google (Gmail)",
  updatedAt: "11 Kasım 2026",
};
