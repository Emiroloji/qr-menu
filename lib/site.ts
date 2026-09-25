import { COMPANY } from "@/lib/company";

// Tanıtım sayfaları (Faz 3.4). Hesaplar süper admin tarafından açılır; işletme talebini
// e-postayla iletir (docs/KARARLAR.md, "Kayıt ve ödeme").

/** Hazır şablonlu "Hesap talebi" e-postası. */
export const accountRequestMailto = `mailto:${COMPANY.supportEmail}?subject=${encodeURIComponent(
  "Hesap talebi",
)}&body=${encodeURIComponent(
  "İşletme adı:\nŞehir:\nŞube sayısı:\nTelefon:\nİlgilendiğiniz paket:\n",
)}`;
