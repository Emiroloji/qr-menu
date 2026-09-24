import { MENU_LABELS } from "../labels";
import { priceLabel, ProductPhoto } from "../parts";
import type { ThemeProps } from "./index";

/** Canlı: renkli başlık bloğu, büyük yazı, kalın çerçeveli kartlar (Faz 0.1). */
export function VibrantTheme({ data, labels = MENU_LABELS }: ThemeProps) {
  const { business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <header className="flex flex-col gap-3 bg-menu-accent px-5 pt-5 pb-5 text-menu-on-accent">
        <p className="text-sm font-medium">
          {branch.name}
          {branch.todayHours && ` · ${branch.todayHours}`}
        </p>
        <h1 className="font-menu-display text-5xl leading-none font-extrabold tracking-tight uppercase">
          {business.name}
        </h1>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto border-b-2 border-menu-line px-5 py-3.5">
        {categories.map((category, i) => (
          <a
            key={category.id}
            href={`#c-${category.id}`}
            className={
              i === 0
                ? "flex h-10 shrink-0 items-center rounded-xl bg-menu-ink px-3.5 text-sm font-extrabold text-menu-bg uppercase"
                : "flex h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-bold uppercase"
            }
          >
            {category.name}
          </a>
        ))}
      </nav>

      <main className="flex flex-col gap-6 px-5 py-4">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex flex-col gap-3"
          >
            <h2 className="font-menu-display text-2xl font-extrabold uppercase">
              {category.name}
            </h2>
            {category.products.map((product) => (
              <article
                key={product.id}
                className="flex overflow-hidden rounded-2xl border-2 border-menu-line"
              >
                <ProductPhoto
                  product={product}
                  width={400}
                  labels={labels}
                  className="w-28 shrink-0 self-stretch"
                />
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  {product.badges[0] && (
                    <span className="w-fit rounded-md bg-menu-accent px-2 py-0.5 text-xs font-extrabold text-menu-on-accent uppercase">
                      {labels.badges[product.badges[0]]}
                    </span>
                  )}
                  <h3 className="text-lg leading-6 font-bold">
                    {product.name}
                  </h3>
                  <span
                    className={
                      product.isAvailable
                        ? "w-fit rounded-full bg-menu-highlight px-2.5 py-1 text-sm font-extrabold text-menu-on-highlight"
                        : "w-fit rounded-full border border-menu-line px-2.5 py-1 text-sm font-bold"
                    }
                  >
                    {product.isAvailable
                      ? priceLabel(product, labels)
                      : labels.soldOut}
                  </span>
                </div>
              </article>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
