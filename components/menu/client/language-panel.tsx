"use client";

import { CheckIcon } from "lucide-react";
import type { MenuClientData } from "../client-data";

export function LanguagePanel({ data }: { data: MenuClientData }) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-6 pb-8">
      <h2 className="pe-10 text-xl font-bold">{data.text.language}</h2>
      <ul className="flex flex-col">
        {data.languages.map((language) => (
          <li key={language.code}>
            <a
              href={language.href}
              lang={language.code}
              hrefLang={language.code}
              aria-current={language.current ? "true" : undefined}
              className="flex min-h-14 items-center gap-3 border-b border-menu-line text-lg"
            >
              <span className="flex h-7 w-9 items-center justify-center rounded-md bg-menu-bg text-xs font-bold uppercase">
                {language.code}
              </span>
              <span
                className={language.current ? "flex-1 font-semibold" : "flex-1"}
              >
                {language.native}
              </span>
              {language.current && (
                <CheckIcon
                  className="size-5 text-menu-accent-text"
                  aria-hidden
                />
              )}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-sm text-menu-muted">{data.text.languageNote}</p>
    </div>
  );
}
