import {
  CategoryNav,
  InfoButton,
  MenuToolbar,
  ProductLink,
} from "../client/islands";
import { priceLabel, ProductPhoto, ServedHours } from "../parts";
import { Promotions } from "../promotions";
import type { ThemeProps } from "./index";

/** Canlı: renkli başlık bloğu, büyük yazı, kalın çerçeveli kartlar (Faz 0.1). */
export function VibrantTheme({ data, labels }: ThemeProps) {
  const { business, branch, categories } = data;
  return (
    <div className="min-h-full bg-menu-bg font-menu-body text-menu-ink">
      <header className="flex flex-col gap-3 bg-menu-accent px-5 pt-4 pb-5 text-menu-on-accent">
        <div className="flex items-center justify-between gap-3">
          <InfoButton className="min-h-11 text-start text-sm font-medium underline-offset-4 hover:underline">
            {branch.name} ·{" "}
            {branch.todayHours ? branch.todayHours : labels.closedToday}
          </InfoButton>
          <MenuToolbar
            className="flex gap-2"
            buttonClassName="flex h-11 min-w-11 items-center justify-center gap-1 rounded-2xl bg-menu-highlight px-2.5 text-menu-on-highlight"
          />
        </div>
        <h1
          dir="auto"
          className="font-menu-display text-5xl leading-none font-extrabold tracking-tight uppercase"
        >
          {business.name}
        </h1>
      </header>

      <CategoryNav
        categories={categories}
        label={labels.categories}
        className="sticky top-0 z-20 flex gap-1.5 overflow-x-auto border-b-2 border-menu-line bg-menu-bg px-5 py-3.5"
        itemClassName="flex h-10 shrink-0 items-center rounded-xl px-3.5 text-sm font-bold uppercase"
        activeItemClassName="flex h-10 shrink-0 items-center rounded-xl bg-menu-ink px-3.5 text-sm font-extrabold text-menu-bg uppercase"
      />

      <main className="flex flex-col gap-6 px-5 py-4">
        <Promotions data={data} labels={labels} />
        {categories.map((category) => (
          <section
            key={category.id}
            id={`c-${category.id}`}
            className="flex scroll-mt-20 flex-col gap-3"
          >
            <h2
              dir="auto"
              className="font-menu-display text-2xl font-extrabold uppercase"
            >
              {category.name}
            </h2>
            <ServedHours category={category} labels={labels} />
            {category.products.map((product) => (
              <ProductLink
                key={product.id}
                id={product.id}
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
                  <h3 dir="auto" className="text-lg leading-6 font-bold">
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
              </ProductLink>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}
