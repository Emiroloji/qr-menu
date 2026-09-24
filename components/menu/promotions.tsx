import Image from "next/image";
import { SparklesIcon } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import { cn } from "@/lib/utils";
import { ProductLink } from "./client/islands";
import type { MenuLabels } from "./labels";
import { priceLabel, ProductPhoto } from "./parts";
import type { MenuCampaign, MenuData, MenuProduct } from "./types";

// Menünün üstündeki kampanya banner'ları, günün önerisi ve öne çıkan ürünler (Faz 2.3).
// Tüm temalar bu bölümü kullanır; renkler temanın CSS değişkenlerinden gelir.

function CampaignCard({
  campaign,
  labels,
  lang,
  first,
  single,
}: {
  campaign: MenuCampaign;
  labels: MenuLabels;
  lang: string;
  first: boolean;
  single: boolean;
}) {
  const until = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  }).format(new Date(campaign.endsAt));
  const image = campaign.image;
  return (
    <article
      className={cn(
        "relative flex aspect-2/1 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl p-4",
        single ? "w-full" : "w-4/5",
        image
          ? "bg-menu-photo text-white"
          : "bg-menu-accent text-menu-on-accent",
      )}
    >
      {image && (
        <>
          <Image
            src={productImageSrc(image.url, 800)}
            alt=""
            fill
            sizes="(max-width: 640px) 85vw, 480px"
            unoptimized
            loading={first ? "eager" : "lazy"}
            fetchPriority={first ? "high" : undefined}
            placeholder={image.blurDataUrl ? "blur" : "empty"}
            blurDataURL={image.blurDataUrl ?? undefined}
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/75 via-black/30 to-transparent"
          />
        </>
      )}
      <div className="relative flex flex-col gap-1">
        <h3
          dir="auto"
          className="line-clamp-2 font-menu-display text-lg leading-tight font-bold"
        >
          {campaign.title}
        </h3>
        {campaign.description && (
          <p dir="auto" className="line-clamp-2 text-sm leading-5 opacity-90">
            {campaign.description}
          </p>
        )}
        <p className="text-xs font-medium opacity-80">
          {labels.campaignUntil(until)}
        </p>
      </div>
    </article>
  );
}

function DailySpecial({
  product,
  labels,
}: {
  product: MenuProduct;
  labels: MenuLabels;
}) {
  return (
    <ProductLink
      id={product.id}
      anchor={false}
      className="flex items-center gap-3.5 rounded-2xl border border-menu-line bg-menu-surface p-3"
    >
      <ProductPhoto
        product={product}
        width={400}
        labels={labels}
        className="size-20 shrink-0 rounded-xl"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex w-fit items-center gap-1 rounded-md bg-menu-highlight px-2 py-0.5 text-xs font-semibold text-menu-on-highlight">
          <SparklesIcon className="size-3.5" aria-hidden />
          {labels.dailySpecial}
        </span>
        <h3 dir="auto" className="truncate font-semibold">
          {product.name}
        </h3>
        <span
          className={
            product.isAvailable ? "font-bold" : "font-bold line-through"
          }
        >
          {priceLabel(product, labels)}
          {!product.isAvailable && (
            <span className="ms-2 text-xs font-semibold no-underline">
              {labels.soldOut}
            </span>
          )}
        </span>
      </div>
    </ProductLink>
  );
}

function FeaturedRow({
  products,
  labels,
}: {
  products: MenuProduct[];
  labels: MenuLabels;
}) {
  return (
    <section aria-labelledby="featured-title" className="flex flex-col gap-3">
      <h2
        id="featured-title"
        className="font-menu-display text-lg font-bold tracking-tight"
      >
        {labels.featured}
      </h2>
      <ul className="flex snap-x gap-3 overflow-x-auto pb-1">
        {products.map((product) => (
          <li key={product.id} className="w-36 shrink-0 snap-start">
            <ProductLink
              id={product.id}
              anchor={false}
              className="flex flex-col gap-2"
            >
              <ProductPhoto
                product={product}
                width={400}
                labels={labels}
                className="aspect-square w-full rounded-xl"
              />
              <h3
                dir="auto"
                className="line-clamp-2 text-sm leading-5 font-semibold"
              >
                {product.name}
              </h3>
              <span
                className={cn(
                  "text-sm font-bold",
                  !product.isAvailable && "line-through",
                )}
              >
                {product.isAvailable
                  ? priceLabel(product, labels)
                  : labels.soldOut}
              </span>
            </ProductLink>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Promotions({
  data,
  labels,
}: {
  data: MenuData;
  labels: MenuLabels;
}) {
  const products = new Map(
    data.categories.flatMap((c) => c.products.map((p) => [p.id, p])),
  );
  const special = data.dailyProductId
    ? products.get(data.dailyProductId)
    : undefined;
  const featured = data.featuredIds.flatMap((id) => products.get(id) ?? []);
  if (data.campaigns.length === 0 && !special && featured.length === 0)
    return null;

  return (
    <div className="flex flex-col gap-5">
      {data.campaigns.length > 0 && (
        <section aria-label={labels.campaigns}>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto">
            {data.campaigns.map((campaign, i) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                labels={labels}
                lang={data.lang}
                first={i === 0}
                single={data.campaigns.length === 1}
              />
            ))}
          </div>
        </section>
      )}
      {special && <DailySpecial product={special} labels={labels} />}
      {featured.length > 0 && (
        <FeaturedRow products={featured} labels={labels} />
      )}
    </div>
  );
}
