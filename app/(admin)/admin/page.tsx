import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/session";

// Geçici ekran; işletme listesi Faz 1.3'te.
export default async function AdminPage() {
  const user = await requireRole("SUPER_ADMIN");

  return (
    <main className="flex flex-1 flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">Süper admin</h1>
      <p className="text-muted-foreground">{user.name}</p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Çıkış yap
        </Button>
      </form>
    </main>
  );
}
