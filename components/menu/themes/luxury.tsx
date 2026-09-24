import { MENU_LABELS } from "../labels";
import { BusinessMark, priceLabel, SpiceLevel } from "../parts";
import type { ThemeProps } from "./index";

/** Lüks: koyu zemin, ortalı serif başlık, fotoğrafsız, noktalı fiyat çizgisi (Faz 0.1). */
export function LuxuryTheme({ data, labels = MENU_LABELS }: ThemeProps) {
  const { appearance, business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <header className="flex flex-col items-center gap-2.5 px-7 pt-9 pb-5 text-center">
        <BusinessMark
          name={business.name}
          logoUrl={appearance.logoUrl}
          labels={labels}
          className="size-14 rounded-full border border-menu-accent-text font-menu-display text-2xl text-menu-accent-text"
        />
        <h1 className="font-menu-display text-3xl font-medium tracking-widest uppercase">
          {business.name}
        </h1>
        <p className="text-xs tracking-widest text-menu-muted uppercase">
          {branch.name}
          {branch.todayHours && ` · ${branch.todayHours}`}
        </p>
      </header>

      <nav className="flex gap-5 overflow-x-auto border-b border-menu-line px-7">
        {categories.map((category, i) => (
          <a
            key={category.id}
            href={`#c-${category.id}`}
            className={
              i === 0
                ? "flex min-h-11 shrink-0 items-center border-b border-menu-accent-text text-xs tracking-widest text-menu-accent-text uppercase"
                : "flex min-h-11 shrink-0 items-center text-xs tracking-widest text-menu-muted uppercase"
            }
          >
            {category.name}
          </a>
        ))}
      </nav>

      <main className="flex flex-col gap-10 px-7 py-7">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex flex-col gap-5"
          >
            <h2 className="text-center font-menu-display text-2xl font-medium text-menu-accent-text italic">
              {category.name}
            </h2>
            {category.products.map((product) => (
              <article key={product.id} className="flex flex-col gap-1">
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
                  <p className="text-sm leading-5 text-menu-muted">
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
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
