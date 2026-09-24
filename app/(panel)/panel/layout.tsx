import Image from "next/image";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { hasAnyMenuPermission, hasPermission } from "@/lib/permissions";
import { getBusinessContext, requireSession } from "@/lib/session";
import {
  type NavItem,
  PanelBottomNav,
  PanelSidebarNav,
} from "./_components/panel-nav";
import { StatusBanner } from "./_components/status-banner";

// Rol kontrolü: yalnızca işletme sahibi ve çalışan.
// Bu kontrol sayfaya girişi korur; her Server Action ayrıca kendi kontrolünü yapar.
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const { user, businessId } = await requireSession();
  const { business, status, subscription } =
    await getBusinessContext(businessId);

  // Menü: sahip veya menü yetkisi olan çalışan. Şube ve ayarlar yalnızca sahip (MIMARI §6).
  const items: NavItem[] = [
    { href: "/panel", label: "Özet", icon: "dashboard" },
    ...(hasAnyMenuPermission(user)
      ? ([
          { href: "/panel/menu", label: "Menü", icon: "menu" },
        ] satisfies NavItem[])
      : []),
    ...(hasPermission(user, "CAMPAIGN_EDIT")
      ? ([
          { href: "/panel/campaigns", label: "Kampanyalar", icon: "campaigns" },
        ] satisfies NavItem[])
      : []),
    ...(user.role === "OWNER"
      ? ([
          { href: "/panel/qr", label: "QR kodlar", icon: "qr" },
          { href: "/panel/stats", label: "İstatistikler", icon: "stats" },
          { href: "/panel/branches", label: "Şubeler", icon: "branches" },
          { href: "/panel/appearance", label: "Görünüm", icon: "appearance" },
          { href: "/panel/staff", label: "Çalışanlar", icon: "staff" },
          { href: "/panel/settings", label: "Ayarlar", icon: "settings" },
        ] satisfies NavItem[])
      : []),
  ];

  const logo = business.logoUrl ? (
    <Image
      src={business.logoUrl}
      alt={`${business.name} logosu`}
      width={32}
      height={32}
      className="size-8 rounded-md object-contain"
    />
  ) : (
    <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
      {business.name.charAt(0)}
    </span>
  );

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-muted/40 md:flex-row">
      <aside className="hidden border-r bg-background md:flex md:w-60 md:shrink-0 md:flex-col md:gap-4 md:py-3">
        <div className="flex items-center gap-2 px-4">
          {logo}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">
              {business.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {subscription
                ? `${subscription.plan.name} paket`
                : "Abonelik yok"}
            </span>
          </span>
        </div>
        <PanelSidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:justify-end md:px-8">
          <span className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
            {logo}
            <span className="truncate text-sm font-semibold">
              {business.name}
            </span>
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.name} · {user.role === "OWNER" ? "İşletme sahibi" : "Çalışan"}
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Çıkış yap
            </Button>
          </form>
        </header>
        <StatusBanner status={status} endsAt={subscription?.endsAt} />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
          {children}
        </main>
      </div>

      <PanelBottomNav items={items} />
      <Toaster />
    </div>
  );
}
