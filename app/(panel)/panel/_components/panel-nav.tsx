"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  EllipsisIcon,
  LayoutDashboardIcon,
  MapPinIcon,
  PaletteIcon,
  QrCodeIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboardIcon,
  menu: BookOpenIcon,
  qr: QrCodeIcon,
  branches: MapPinIcon,
  appearance: PaletteIcon,
  staff: UsersIcon,
  settings: SettingsIcon,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

function isActive(pathname: string, href: string) {
  return href === "/panel" ? pathname === href : pathname.startsWith(href);
}

/** Masaüstünde kenar menüsü. */
export function PanelSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel menüsü" className="flex flex-col gap-1 px-2">
      {items.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
              active && "bg-muted text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

const tabClass = (active: boolean) =>
  cn(
    "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
    active && "text-foreground",
  );

/** Telefonda alt menü: en fazla 4 sekme; fazlası "Daha fazla" içinde (Faz 0.2 tasarımı). */
export function PanelBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const primary = items.length > 4 ? items.slice(0, 3) : items;
  const more = items.length > 4 ? items.slice(3) : [];
  const moreActive = more.some((item) => isActive(pathname, item.href));

  return (
    <nav
      aria-label="Panel menüsü"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {primary.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={tabClass(active)}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      {more.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={tabClass(moreActive)}
            aria-haspopup="dialog"
          >
            <EllipsisIcon className="size-5" />
            Daha fazla
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent
              side="bottom"
              className="pb-[env(safe-area-inset-bottom)]"
            >
              <SheetHeader>
                <SheetTitle>Daha fazla</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col px-2 pb-4">
                {more.map(({ href, label, icon }) => {
                  const Icon = ICONS[icon];
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-12 items-center gap-3 rounded-md px-3 text-base font-medium",
                        active && "bg-muted",
                      )}
                    >
                      <Icon className="size-5 text-muted-foreground" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </nav>
  );
}
