import Link from "next/link";
import { Onest, Young_Serif } from "next/font/google";
import { COMPANY } from "@/lib/company";
import { accountRequestMailto } from "@/lib/site";

const youngSerif = Young_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-young-serif",
});
const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
});

function Mark() {
  // Dört köşesi olan küçük bir QR işareti: köşe kareleri tanıdık, gerisi sade.
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="5" className="fill-site-green" />
      {[
        [4, 4],
        [14, 4],
        [4, 14],
      ].map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="6"
          height="6"
          rx="1.5"
          className="fill-site-lemon"
        />
      ))}
      <rect x="15" y="15" width="4" height="4" rx="1" className="fill-white" />
    </svg>
  );
}

/** Tanıtım, yardım ve örnek menü sayfalarının ortak düzeni (FAZLAR 3.4). */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={`${youngSerif.variable} ${onest.variable} flex min-h-dvh flex-col bg-white font-site-body text-site-ink`}
    >
      <header className="border-b border-site-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link
            href="/"
            className="flex items-center gap-2 font-site-display text-xl"
          >
            <Mark />
            QR Menü
          </Link>
          <nav
            aria-label="Site"
            className="ml-auto flex items-center gap-1 text-sm"
          >
            <Link
              href="/#nasil"
              className="hidden rounded-md px-3 py-2 text-site-muted hover:text-site-ink sm:block"
            >
              Nasıl çalışır
            </Link>
            <Link
              href="/#paketler"
              className="hidden rounded-md px-3 py-2 text-site-muted hover:text-site-ink sm:block"
            >
              Paketler
            </Link>
            <Link
              href="/yardim"
              className="rounded-md px-3 py-2 text-site-muted hover:text-site-ink"
            >
              Yardım
            </Link>
            <Link
              href="/login"
              className="ml-1 rounded-full border border-site-line px-4 py-2 font-medium hover:border-site-ink"
            >
              Giriş
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t border-site-line bg-site-mist">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-sm text-site-muted sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 font-site-display text-lg text-site-ink">
              <Mark />
              QR Menü
            </span>
            <span>{COMPANY.legalName}</span>
          </div>
          <ul className="flex flex-col gap-2">
            <li>
              <a href={accountRequestMailto} className="hover:text-site-ink">
                {COMPANY.supportEmail}
              </a>
            </li>
            <li>
              <Link href="/yardim" className="hover:text-site-ink">
                Yardım merkezi
              </Link>
            </li>
            <li>
              <Link href="/demo" className="hover:text-site-ink">
                Örnek menü
              </Link>
            </li>
          </ul>
          <ul className="flex flex-col gap-2">
            <li>
              <Link href="/kvkk" className="hover:text-site-ink">
                KVKK aydınlatma metni
              </Link>
            </li>
            <li>
              <Link href="/kullanim-kosullari" className="hover:text-site-ink">
                Kullanım koşulları
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
