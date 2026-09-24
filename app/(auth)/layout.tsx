import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-muted p-4">
      <div className="flex w-full max-w-sm flex-col gap-4">
        {children}
        <nav
          aria-label="Yasal"
          className="flex justify-center gap-4 text-xs text-muted-foreground"
        >
          <Link href="/kvkk" className="underline-offset-4 hover:underline">
            KVKK aydınlatma metni
          </Link>
          <Link
            href="/kullanim-kosullari"
            className="underline-offset-4 hover:underline"
          >
            Kullanım koşulları
          </Link>
        </nav>
      </div>
    </main>
  );
}
