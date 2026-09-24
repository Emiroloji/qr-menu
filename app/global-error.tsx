"use client";

import "./globals.css";

/** Kök düzende hata: kendi <html> ve <body> etiketlerini çizer. */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="tr">
      <body className="flex min-h-dvh flex-col">
        <title>Bir şeyler ters gitti</title>
        <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-stone-50 p-8 text-center text-stone-900 dark:bg-stone-950 dark:text-stone-100">
          <h1 className="text-2xl font-bold">Bir şeyler ters gitti</h1>
          <p className="text-stone-600 dark:text-stone-400">
            Lütfen tekrar deneyin.
          </p>
          <p lang="en" className="text-sm text-stone-600 dark:text-stone-400">
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="h-11 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-900"
          >
            Tekrar dene
          </button>
        </main>
      </body>
    </html>
  );
}
