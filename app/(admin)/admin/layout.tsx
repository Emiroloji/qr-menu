import { QrCodeIcon } from "lucide-react";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { requireRole } from "@/lib/session";
import { AdminNav } from "./_components/admin-nav";

// Rol kontrolü: yalnızca SUPER_ADMIN. Her Server Action ayrıca kendi kontrolünü yapar.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("SUPER_ADMIN");

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-muted/40 md:flex-row">
      <aside className="border-b bg-background md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-14 items-center gap-2 px-4">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <QrCodeIcon className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">QR Menü</span>
            <span className="text-xs text-muted-foreground">Süper admin</span>
          </span>
        </div>
        <AdminNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-3 border-b bg-background px-4 md:px-8">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Çıkış yap
            </Button>
          </form>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
