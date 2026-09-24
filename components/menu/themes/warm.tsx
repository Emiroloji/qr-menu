import Image from "next/image";
import { MENU_LABELS } from "../labels";
import { BusinessMark, priceLabel, ProductPhoto } from "../parts";
import type { ThemeProps } from "./index";

/** Sıcak: kapak görseli, üst üste binen logo, iki sütunlu kartlar (Faz 0.1). */
export function WarmTheme({ data, labels = MENU_LABELS }: ThemeProps) {
  const { appearance, business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <div className="relative h-40 overflow-hidden rounded-b-3xl bg-menu-photo">
        {appearance.coverUrl && (
          <Image
            src={appearance.coverUrl}
            alt={labels.cover}
            fill
            sizes="480px"
            className="object-cover"
            priority
          />
        )}
      </div>
      <header className="-mt-9 flex flex-col gap-2.5 px-5 pb-4">
        <BusinessMark
          name={business.name}
          logoUrl={appearance.logoUrl}
          labels={labels}
          className="size-18 rounded-full border-4 border-menu-bg bg-menu-accent font-menu-display text-3xl font-bold text-menu-on-accent"
        />
        <div>
          <h1 className="font-menu-display text-3xl font-bold">
            {business.name}
          </h1>
          <p className="text-sm text-menu-muted">
            {branch.name}
            {branch.todayHours && ` · ${labels.open}, ${branch.todayHours}`}
          </p>
        </div>
      </header>

      <nav className="flex gap-2 overflow-x-auto px-5 pb-4">
        {categories.map((category, i) => (
          <a
            key={category.id}
            href={`#c-${category.id}`}
            className={
              i === 0
                ? "flex h-10 shrink-0 items-center rounded-full bg-menu-accent px-4 text-sm font-bold text-menu-on-accent"
                : "flex h-10 shrink-0 items-center rounded-full bg-menu-surface px-4 text-sm font-bold"
            }
          >
            {category.name}
          </a>
        ))}
      </nav>

      <main className="flex flex-col gap-6 px-5 pb-6">
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex flex-col gap-3"
          >
            <h2 className="font-menu-display text-2xl font-bold">
              {category.name}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {category.products.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-2 rounded-3xl bg-menu-surface p-2 pb-3"
                >
                  <div className="relative">
                    <ProductPhoto
                      product={product}
                      width={400}
                      labels={labels}
                      className="aspect-square rounded-2xl"
                    />
                    {product.badges[0] && (
                      <span className="absolute top-2 left-2 rounded-full bg-menu-surface px-2 py-1 text-xs font-bold">
                        {labels.badges[product.badges[0]]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-1">
                    <h3 className="text-sm leading-5 font-bold">
                      {product.name}
                    </h3>
                    <span className="text-sm font-bold text-menu-accent-text">
                      {product.isAvailable
                        ? priceLabel(product, labels)
                        : labels.soldOut}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
