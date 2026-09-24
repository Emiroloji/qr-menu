"use client";

import Image from "next/image";
import { FlameIcon } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import type { ClientProduct, MenuClientData } from "../client-data";
import { TagIcon } from "./tag-icon";

const NUTRITION = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "sugar",
  "salt",
] as const;

export function ProductDetail({
  product,
  data,
}: {
  product: ClientProduct;
  data: MenuClientData;
}) {
  const { text } = data;
  const format = (value: number) =>
    new Intl.NumberFormat(data.lang).format(value);
  const nutrition = product.nutrition
    ? NUTRITION.filter((key) => product.nutrition![key] !== null).map(
        (key) => ({
          key,
          value: `${format(product.nutrition![key]!)} ${key === "calories" ? "kcal" : "g"}`,
        }),
      )
    : [];
  const details = [
    [text.ingredients, product.ingredients],
    [text.portion, product.portion],
    [
      text.prepTime,
      product.prepTime
        ? text.minutes.replace("{count}", String(product.prepTime))
        : null,
    ],
    [text.origin, product.origin],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <article className="flex flex-col">
      {product.image && (
        <div className="relative aspect-4/3 w-full bg-menu-photo">
          <Image
            src={productImageSrc(product.image.url, 800)}
            alt={text.photoOf.replace("{name}", product.name)}
            fill
            sizes="100vw"
            unoptimized
            placeholder={product.image.blurDataUrl ? "blur" : "empty"}
            blurDataURL={product.image.blurDataUrl ?? undefined}
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-5 px-5 pt-5 pb-8">
        <header className="flex flex-col gap-2 pe-10">
          {(product.badges.length > 0 || !product.isAvailable) && (
            <div className="flex flex-wrap gap-1.5">
              {!product.isAvailable && (
                <span className="rounded-md border border-menu-ink px-2 py-0.5 text-xs font-semibold">
                  {text.soldOut}
                </span>
              )}
              {product.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-menu-accent px-2 py-0.5 text-xs font-semibold text-menu-on-accent"
                >
                  {text[b]}
                </span>
              ))}
            </div>
          )}
          <h2 dir="auto" className="font-menu-display text-2xl font-bold">
            {product.name}
          </h2>
          {product.description && (
            <p dir="auto" className="leading-6 text-menu-muted">
              {product.description}
            </p>
          )}
          {product.variants.length === 1 && !product.variants[0].name && (
            <p
              className={
                product.isAvailable
                  ? "text-lg font-bold"
                  : "text-lg font-bold line-through"
              }
            >
              {product.variants[0].priceText}
            </p>
          )}
        </header>

        {(product.variants.length > 1 || product.variants[0]?.name) && (
          <section
            aria-label={text.sizes}
            className="overflow-hidden rounded-2xl border border-menu-line"
          >
            {product.variants.map((v, i) => (
              <div
                key={i}
                className="flex justify-between gap-4 border-b border-menu-line px-4 py-3 last:border-b-0"
              >
                <span dir="auto">{v.name}</span>
                <span className="font-bold tabular-nums">{v.priceText}</span>
              </div>
            ))}
          </section>
        )}

        {(product.tags.length > 0 || product.spiceLevel > 0) && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {product.tags.map((tag) => (
              <li
                key={tag.code}
                className="flex items-center gap-1.5 rounded-full border border-menu-line px-3 py-1"
              >
                <TagIcon code={tag.code} className="size-4" />
                {tag.name}
              </li>
            ))}
            {product.spiceLevel > 0 && (
              <li className="flex items-center gap-1.5 rounded-full border border-menu-line px-3 py-1">
                <span className="flex text-menu-accent-text" aria-hidden>
                  {Array.from({ length: product.spiceLevel }, (_, i) => (
                    <FlameIcon key={i} className="size-4" />
                  ))}
                </span>
                {text[`spice${product.spiceLevel}` as "spice1"]}
              </li>
            )}
          </ul>
        )}

        <section className="flex flex-col gap-2.5">
          <h3
            dir="auto"
            className="text-xs font-semibold tracking-wider text-menu-muted uppercase"
          >
            {text.allergens}
          </h3>
          {product.allergens.length === 0 ? (
            <p dir="auto" className="text-sm text-menu-muted">
              {text.noAllergens}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {product.allergens.map((a) => (
                <li key={a.code} className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={
                      a.level === "CONTAINS"
                        ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-menu-ink text-xs font-bold text-menu-bg"
                        : "flex size-8 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-menu-ink text-xs font-bold"
                    }
                  >
                    {a.name.charAt(0)}
                  </span>
                  <span className="flex-1">{a.name}</span>
                  <span
                    className={
                      a.level === "CONTAINS"
                        ? "text-sm font-semibold"
                        : "text-sm text-menu-muted"
                    }
                  >
                    {a.level === "CONTAINS" ? text.contains : text.mayContain}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p dir="auto" className="text-xs text-menu-muted">
            {text.allergenNote}
          </p>
        </section>

        {nutrition.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h3
              dir="auto"
              className="text-xs font-semibold tracking-wider text-menu-muted uppercase"
            >
              {text.nutrition}
            </h3>
            <dl className="grid grid-cols-3 gap-2">
              {nutrition.map((n) => (
                <div key={n.key} className="rounded-xl bg-menu-bg px-3 py-2">
                  <dd className="font-bold tabular-nums">{n.value}</dd>
                  <dt className="text-xs text-menu-muted">{text[n.key]}</dt>
                </div>
              ))}
            </dl>
          </section>
        )}

        {details.length > 0 && (
          <dl className="flex flex-col text-sm">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-menu-line py-2.5 last:border-b-0"
              >
                <dt className="text-menu-muted">{label}</dt>
                <dd className="text-end">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
