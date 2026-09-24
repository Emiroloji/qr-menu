import { requireSession } from "@/lib/session";

// Rol kontrolü: yalnızca işletme sahibi ve çalışan. Panel düzeni Faz 1.4'te.
// Not: Bu kontrol sayfaya girişi korur; her Server Action ayrıca kendi kontrolünü yapar.
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  await requireSession();
  return children;
}
