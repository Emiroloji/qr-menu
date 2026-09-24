import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/session";

// Geçici özet ekranı; gerçek özet Faz 1.4'te.
export default async function PanelPage() {
  const { user } = await requireSession();

  return (
    <main className="flex flex-1 flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold">İşletme paneli</h1>
      <p className="text-muted-foreground">
        {user.name} · {user.role === "OWNER" ? "İşletme sahibi" : "Çalışan"}
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Çıkış yap
        </Button>
      </form>
    </main>
  );
}
