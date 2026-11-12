import Link from "next/link";
import { Bricolage_Grotesque, Onest } from "next/font/google";
import { COMPANY } from "@/lib/company";
import { accountRequestMailto } from "@/lib/site";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
});
const onest = Onest({
  subsets: ["latin", "latin-ext"],
  variable: "--font-onest",
});

/** karefix işareti: karekodun köşe karesi. */
function Mark() {
  return (
    <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
      <rect
        x="2.5"
        y="2.5"
        width="23"
        height="23"
        rx="5"
        className="fill-none stroke-site-ink"
        strokeWidth="5"
      />
      <rect
        x="10"
        y="10"
        width="8"
        height="8"
        rx="1.5"
        className="fill-site-ink"
      />
    </svg>
  );
}

function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`flex items-center gap-2 font-site-display font-extrabold tracking-tight text-site-ink ${className ?? ""}`}
    >
      <Mark />
      karefix
    </span>
  );
}

/** Tanıtım, yardım ve örnek menü sayfalarının ortak düzeni (FAZLAR 3.4). */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div
      className={`${bricolage.variable} ${onest.variable} flex min-h-dvh flex-col bg-white font-site-body text-site-ink`}
    >
      <header className="bg-site-lemon">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link href="/" aria-label="karefix ana sayfa">
            <Wordmark className="text-2xl" />
          </Link>
          <nav
            aria-label="Site"
            className="ml-auto flex items-center gap-1 text-sm"
          >
            <Link
              href="/#nasil"
              className="hidden rounded-md px-3 py-2 font-medium text-site-ink/75 hover:text-site-ink sm:block"
            >
              Nasıl çalışır
            </Link>
            <Link
              href="/#paketler"
              className="hidden rounded-md px-3 py-2 font-medium text-site-ink/75 hover:text-site-ink sm:block"
            >
              Paketler
            </Link>
            <Link
              href="/yardim"
              className="rounded-md px-3 py-2 font-medium text-site-ink/75 hover:text-site-ink"
            >
              Yardım
            </Link>
            <Link
              href="/login"
              className="ml-1 rounded-lg bg-site-ink px-4 py-2 font-medium text-white hover:bg-site-green"
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
            <Wordmark className="text-xl" />
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
