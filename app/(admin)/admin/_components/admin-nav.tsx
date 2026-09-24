"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCardIcon, LayoutGridIcon, StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/businesses", label: "İşletmeler", icon: StoreIcon },
  { href: "/admin/plans", label: "Paketler", icon: LayoutGridIcon },
  { href: "/admin/subscriptions", label: "Abonelikler", icon: CreditCardIcon },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin menüsü"
      className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0"
    >
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
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
