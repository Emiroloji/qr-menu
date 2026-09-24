import {
  CategoryNav,
  InfoButton,
  MenuToolbar,
  ProductLink,
} from "../client/islands";
import { BusinessMark, priceLabel, SpiceLevel } from "../parts";
import { Promotions } from "../promotions";
import type { ThemeProps } from "./index";

/** Lüks: koyu zemin, ortalı serif başlık, fotoğrafsız, noktalı fiyat çizgisi (Faz 0.1). */
export function LuxuryTheme({ data, labels }: ThemeProps) {
  const { appearance, business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <header className="relative flex flex-col items-center gap-2.5 px-7 pt-9 pb-5 text-center">
        <MenuToolbar
          className="absolute end-4 top-4 flex gap-2"
          buttonClassName="flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-menu-line px-2.5"
        />
        <BusinessMark
          name={business.name}
          logoUrl={appearance.logoUrl}
          labels={labels}
          className="size-14 rounded-full border border-menu-accent-text font-menu-display text-2xl text-menu-accent-text"
        />
        <h1
          dir="auto"
          className="font-menu-display text-3xl font-medium tracking-widest uppercase"
        >
          {business.name}
        </h1>
        <InfoButton className="min-h-11 text-xs tracking-widest text-menu-muted uppercase underline-offset-4 hover:underline">
          {branch.name} ·{" "}
          {branch.todayHours ? branch.todayHours : labels.closedToday}
        </InfoButton>
      </header>

      <CategoryNav
        categories={categories}
        label={labels.categories}
        className="sticky top-0 z-20 flex gap-5 overflow-x-auto border-b border-menu-line bg-menu-bg px-7"
        itemClassName="flex min-h-11 shrink-0 items-center border-b border-transparent text-xs tracking-widest text-menu-muted uppercase"
        activeItemClassName="flex min-h-11 shrink-0 items-center border-b border-menu-accent-text text-xs tracking-widest text-menu-accent-text uppercase"
      />

      <main className="flex flex-col gap-10 px-7 py-7">
        <Promotions data={data} labels={labels} />
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex scroll-mt-14 flex-col gap-5"
          >
            <h2
              dir="auto"
              className="text-center font-menu-display text-2xl font-medium text-menu-accent-text italic"
            >
              {category.name}
            </h2>
            {category.products.map((product) => (
              <ProductLink
                key={product.id}
                id={product.id}
                className="flex flex-col gap-1"
              >
                <div className="flex items-baseline gap-2">
                  <h3
                    className={
                      product.isAvailable
                        ? "font-menu-display text-xl font-semibold"
                        : "font-menu-display text-xl font-semibold line-through opacity-80"
                    }
                  >
                    {product.name}
                  </h3>
                  <span
                    className="flex-1 -translate-y-1 border-b border-dotted border-menu-muted/60"
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-menu-accent-text">
                    {product.isAvailable
                      ? priceLabel(product, labels)
                      : labels.soldOut}
                  </span>
                </div>
                {product.description && (
                  <p dir="auto" className="text-sm leading-5 text-menu-muted">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs tracking-widest text-menu-muted uppercase">
                  {[
                    ...product.badges.map((b) => labels.badges[b]),
                    ...product.tags.map((t) => t.name),
                  ].join(" · ")}
                  <SpiceLevel level={product.spiceLevel} labels={labels} />
                </div>
              </ProductLink>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
