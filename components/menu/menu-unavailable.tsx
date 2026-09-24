import { BookXIcon } from "lucide-react";
import type { LanguageCode } from "@/lib/languages";
import type { MenuMessages } from "./labels";

/** Abonelik bitti, askıda veya işletme pasif (Faz 0.1 · Menü kapalı). */
export function MenuUnavailable({
  lang,
  messages,
  english,
}: {
  lang: LanguageCode;
  messages: MenuMessages;
  /** Seçili dil İngilizce değilse, turistler için İngilizce satır */
  english: MenuMessages | null;
}) {
  return (
    <main
      lang={lang}
      className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-5 bg-stone-50 px-8 text-center text-stone-900 dark:bg-stone-950 dark:text-stone-100"
    >
      <span className="flex size-18 items-center justify-center rounded-3xl border border-stone-200 bg-white text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        <BookXIcon className="size-8" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {messages.unavailableTitle}
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          {messages.unavailableText}
        </p>
      </div>
      {english && (
        <p lang="en" className="text-sm text-stone-600 dark:text-stone-400">
          {english.unavailableTitle}. {english.unavailableText}
        </p>
      )}
    </main>
  );
}
