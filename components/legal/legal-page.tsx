import Link from "next/link";

/**
 * Yasal metin sayfası düzeni. Metinler TASLAKTIR: köşeli parantezli alanlar
 * ([ŞİRKET UNVANI] vb.) doldurulmalı ve yayından önce bir hukukçuya onaylatılmalıdır.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10 text-stone-900 dark:text-stone-100">
      <Link
        href="/"
        className="text-sm text-stone-600 underline-offset-4 hover:underline dark:text-stone-400"
      >
        QR Menü
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Son güncelleme: {updatedAt}
        </p>
      </header>
      <div className="flex flex-col gap-4 leading-7 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ms-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </main>
  );
}
