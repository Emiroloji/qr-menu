"use client";

import { useMemo, useState } from "react";
import { createTranslator } from "next-intl";
import { ArrowLeftIcon, SearchIcon } from "lucide-react";
import { filterProducts } from "@/lib/menu-filter";
import type { MenuClientData } from "../client-data";
import { Sheet } from "./sheet";
import { TagIcon } from "./tag-icon";

// Yalnızca arama açıldığında yüklenir (next/dynamic); menünün ilk açılışına yük getirmez.
export default function SearchDialog({
  data,
  open,
  onClose,
  onSelect,
}: {
  data: MenuClientData;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [exclude, setExclude] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const t = useMemo(
    () =>
      createTranslator({
        locale: data.lang,
        messages: { menu: data.text },
        namespace: "menu",
      }),
    [data.lang, data.text],
  );
  const active = query.trim() !== "" || exclude.length > 0 || diets.length > 0;
  const results = useMemo(
    () =>
      active ? filterProducts(data.products, { query, exclude, diets }) : [],
    [active, data.products, query, exclude, diets],
  );
  const allergenName = (code: string) =>
    data.allergens.find((a) => a.code === code)?.name ?? code;
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const chip = (pressed: boolean) =>
    pressed
      ? "flex h-10 items-center gap-1.5 rounded-full border border-menu-ink bg-menu-ink px-3.5 text-sm font-medium text-menu-bg"
      : "flex h-10 items-center gap-1.5 rounded-full border border-menu-line bg-menu-surface px-3.5 text-sm font-medium";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={data.text.search}
      closeLabel={data.text.close}
      full
    >
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-menu-bg px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onClose}
          aria-label={data.text.close}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-menu-line bg-menu-surface"
        >
          <ArrowLeftIcon className="size-5 rtl:rotate-180" aria-hidden />
        </button>
        <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl border border-menu-line bg-menu-surface px-3.5 focus-within:border-menu-ink">
          <SearchIcon className="size-5 shrink-0 text-menu-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={data.text.searchPlaceholder}
            aria-label={data.text.search}
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-menu-muted"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 border-b border-menu-line px-4 pb-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-menu-muted uppercase">
            {data.text.exclude}
          </legend>
          <div className="flex flex-wrap gap-2">
            {data.allergens.map((a) => (
              <button
                key={a.code}
                type="button"
                aria-pressed={exclude.includes(a.code)}
                onClick={() => setExclude((list) => toggle(list, a.code))}
                className={chip(exclude.includes(a.code))}
              >
                {a.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-semibold tracking-wider text-menu-muted uppercase">
            {data.text.diet}
          </legend>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <button
                key={tag.code}
                type="button"
                aria-pressed={diets.includes(tag.code)}
                onClick={() => setDiets((list) => toggle(list, tag.code))}
                className={chip(diets.includes(tag.code))}
              >
                <TagIcon code={tag.code} className="size-4" />
                {tag.name}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-col gap-2 px-4 py-4">
        {!active ? (
          <p dir="auto" className="py-6 text-center text-sm text-menu-muted">
            {data.text.searchHint}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p role="status" className="text-sm text-menu-muted">
                {t("results", { count: results.length })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setExclude([]);
                  setDiets([]);
                }}
                className="min-h-11 text-sm font-semibold text-menu-accent-text"
              >
                {data.text.clearFilters}
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {results.map(({ product, traces }) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(product.id)}
                    className="flex w-full flex-col gap-1 rounded-2xl border border-menu-line bg-menu-surface p-3 text-start"
                  >
                    <span className="flex w-full justify-between gap-3">
                      <span dir="auto" className="font-semibold">
                        {product.name}
                      </span>
                      <span
                        className={
                          product.isAvailable
                            ? "shrink-0 font-bold"
                            : "shrink-0 text-sm"
                        }
                      >
                        {product.isAvailable
                          ? product.priceText
                          : data.text.soldOut}
                      </span>
                    </span>
                    <span className="text-sm text-menu-muted">
                      {product.categoryName}
                    </span>
                    {traces.map((code) => (
                      <span
                        key={code}
                        className="w-fit rounded-md border-2 border-dashed border-menu-muted px-2 py-0.5 text-xs"
                      >
                        {t("mayContainWarning", { name: allergenName(code) })}
                      </span>
                    ))}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}
