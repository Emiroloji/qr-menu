import Image from "next/image";
import {
  CategoryNav,
  InfoButton,
  MenuToolbar,
  ProductLink,
} from "../client/islands";
import { BusinessMark, priceLabel, ProductPhoto, ServedHours } from "../parts";
import { Promotions } from "../promotions";
import type { ThemeProps } from "./index";

/** Sıcak: kapak görseli, üst üste binen logo, iki sütunlu kartlar (Faz 0.1). */
export function WarmTheme({ data, labels }: ThemeProps) {
  const { appearance, business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <div className="relative h-40 overflow-hidden rounded-b-3xl bg-menu-photo">
        {appearance.coverUrl && (
          <Image
            src={appearance.coverUrl}
            alt={labels.cover}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <MenuToolbar
          className="absolute end-4 top-4 flex gap-2"
          buttonClassName="flex h-11 min-w-11 items-center justify-center gap-1 rounded-full bg-menu-bg px-3 font-bold"
        />
      </div>
      <header className="-mt-9 flex flex-col gap-2.5 px-5 pb-4">
        <BusinessMark
          name={business.name}
          logoUrl={appearance.logoUrl}
          labels={labels}
          className="relative size-18 rounded-full border-4 border-menu-bg bg-menu-accent font-menu-display text-3xl font-bold text-menu-on-accent"
        />
        <div className="flex flex-col items-start">
          <h1 dir="auto" className="font-menu-display text-3xl font-bold">
            {business.name}
          </h1>
          <InfoButton className="min-h-11 text-start text-sm text-menu-muted underline-offset-4 hover:underline">
            {branch.name} ·{" "}
            {branch.todayHours
              ? labels.todayHours(branch.todayHours)
              : labels.closedToday}
          </InfoButton>
        </div>
      </header>

      <CategoryNav
        categories={categories}
        label={labels.categories}
        className="sticky top-0 z-20 flex gap-2 overflow-x-auto bg-menu-bg px-5 py-3"
        itemClassName="flex h-10 shrink-0 items-center rounded-full bg-menu-surface px-4 text-sm font-bold"
        activeItemClassName="flex h-10 shrink-0 items-center rounded-full bg-menu-accent px-4 text-sm font-bold text-menu-on-accent"
      />

      <main className="flex flex-col gap-6 px-5 pb-6">
        <Promotions data={data} labels={labels} />
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex scroll-mt-16 flex-col gap-3"
          >
            <h2 dir="auto" className="font-menu-display text-2xl font-bold">
              {category.name}
            </h2>
            <ServedHours category={category} labels={labels} />
            <div className="grid grid-cols-2 gap-3">
              {category.products.map((product) => (
                <ProductLink
                  key={product.id}
                  id={product.id}
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
                      <span className="absolute start-2 top-2 rounded-full bg-menu-surface px-2 py-1 text-xs font-bold">
                        {labels.badges[product.badges[0]]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 px-1">
                    <h3 dir="auto" className="text-sm leading-5 font-bold">
                      {product.name}
                    </h3>
                    <span className="text-sm font-bold text-menu-accent-text">
                      {product.isAvailable
                        ? priceLabel(product, labels)
                        : labels.soldOut}
                    </span>
                  </div>
                </ProductLink>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
