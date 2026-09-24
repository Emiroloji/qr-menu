import { ClockIcon, MapPinIcon, WifiIcon } from "lucide-react";
import {
  CategoryNav,
  InfoButton,
  MenuToolbar,
  ProductLink,
} from "../client/islands";
import { BusinessMark, priceLabel, ProductPhoto, SpiceLevel } from "../parts";
import type { ThemeProps } from "./index";

const chip =
  "flex h-9 items-center gap-1.5 rounded-full border border-menu-line bg-menu-surface px-3 text-xs";

/** Minimal: açık zemin, sağda kare fotoğraflı liste (Faz 0.1 · Ana ekran). */
export function MinimalTheme({ data, labels }: ThemeProps) {
  const { appearance, business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <header className="flex flex-col gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <BusinessMark
            name={business.name}
            logoUrl={appearance.logoUrl}
            labels={labels}
            className="size-13 rounded-2xl bg-menu-accent text-xl font-bold text-menu-on-accent"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <h1
              dir="auto"
              className="truncate text-xl font-bold tracking-tight"
            >
              {business.name}
            </h1>
            <p dir="auto" className="text-sm text-menu-muted">
              {branch.name}
            </p>
          </div>
          <MenuToolbar
            className="flex gap-2"
            buttonClassName="flex h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-menu-line bg-menu-surface px-2.5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <InfoButton className={chip}>
            <ClockIcon className="size-3.5" aria-hidden />
            {branch.todayHours
              ? labels.todayHours(branch.todayHours)
              : labels.closedToday}
          </InfoButton>
          {branch.wifi && (
            <InfoButton className={chip}>
              <WifiIcon className="size-3.5" aria-hidden />
              {labels.wifi}
            </InfoButton>
          )}
          {branch.address && (
            <InfoButton className={chip}>
              <MapPinIcon className="size-3.5" aria-hidden />
              {labels.address}
            </InfoButton>
          )}
        </div>
      </header>

      <CategoryNav
        categories={categories}
        label={labels.categories}
        className="sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-menu-line bg-menu-bg px-5 pt-2 pb-3"
        itemClassName="flex h-10 shrink-0 items-center rounded-full border border-menu-line bg-menu-surface px-4 text-sm font-semibold"
        activeItemClassName="flex h-10 shrink-0 items-center rounded-full border border-menu-accent bg-menu-accent px-4 text-sm font-semibold text-menu-on-accent"
      />

      <main className="flex flex-col gap-6 px-5 py-5">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex scroll-mt-16 flex-col"
          >
            <h2 dir="auto" className="mb-1 text-xl font-bold tracking-tight">
              {category.name}
            </h2>
            {category.description && (
              <p dir="auto" className="mb-2 text-sm text-menu-muted">
                {category.description}
              </p>
            )}
            {category.products.map((product) => (
              <ProductLink
                key={product.id}
                id={product.id}
                className="flex gap-3.5 border-b border-menu-line py-3.5 last:border-b-0"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {product.badges[0] && (
                    <span className="w-fit rounded-md bg-menu-accent px-2 py-0.5 text-xs font-semibold text-menu-on-accent">
                      {labels.badges[product.badges[0]]}
                    </span>
                  )}
                  <h3 dir="auto" className="font-semibold">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p
                      dir="auto"
                      className="line-clamp-2 text-sm leading-5 text-menu-muted"
                    >
                      {product.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={
                        product.isAvailable
                          ? "font-bold"
                          : "font-bold line-through"
                      }
                    >
                      {priceLabel(product, labels)}
                    </span>
                    {!product.isAvailable && (
                      <span className="rounded-md border border-menu-ink px-2 py-0.5 text-xs font-semibold">
                        {labels.soldOut}
                      </span>
                    )}
                    <SpiceLevel level={product.spiceLevel} labels={labels} />
                    {product.tags.length > 0 && (
                      <span className="text-xs text-menu-muted">
                        {product.tags.map((t) => t.name).join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
                <ProductPhoto
                  product={product}
                  width={400}
                  labels={labels}
                  className="size-24 shrink-0 rounded-2xl"
                />
              </ProductLink>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
