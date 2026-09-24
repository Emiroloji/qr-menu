import Image from "next/image";
import { FlameIcon, ImageIcon } from "lucide-react";
import { productImageSrc } from "@/lib/product-image";
import { cn } from "@/lib/utils";
import { priceText } from "./client-data";
import type { MenuLabels } from "./labels";
import type { MenuProduct } from "./types";

/** "₺85,00" veya çok boylu üründe "₺85,00’den" */
export function priceLabel(product: MenuProduct, labels: MenuLabels) {
  return priceText(product, labels);
}

/** Ürün görseli: önceden üretilmiş 400/800/1200 px dosyadan (MIMARI §9). */
export function ProductPhoto({
  product,
  width,
  labels,
  className,
}: {
  product: MenuProduct;
  width: number;
  labels: MenuLabels;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-menu-photo", className)}>
      {product.image ? (
        <Image
          src={productImageSrc(product.image.url, width)}
          alt={labels.photoOf(product.name)}
          fill
          sizes={`${width}px`}
          unoptimized
          loading="lazy"
          placeholder={product.image.blurDataUrl ? "blur" : "empty"}
          blurDataURL={product.image.blurDataUrl ?? undefined}
          className={cn(
            "object-cover",
            !product.isAvailable && "opacity-40 grayscale",
          )}
        />
      ) : (
        <ImageIcon
          className="absolute inset-0 m-auto size-7 text-menu-muted opacity-50"
          aria-hidden
        />
      )}
    </div>
  );
}

export function SpiceLevel({
  level,
  labels,
}: {
  level: number;
  labels: MenuLabels;
}) {
  if (level <= 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-menu-accent-text">
      <span className="sr-only">
        {labels.spice} {level}/3
      </span>
      {Array.from({ length: level }, (_, i) => (
        <FlameIcon key={i} className="size-3.5" aria-hidden />
      ))}
    </span>
  );
}

/** Logo yoksa işletme adının baş harfi. */
export function BusinessMark({
  name,
  logoUrl,
  labels,
  className,
}: {
  name: string;
  logoUrl: string | null;
  labels: MenuLabels;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={labels.logoOf(name)}
          fill
          sizes="96px"
          className="object-contain"
        />
      ) : (
        <span aria-hidden>{name.charAt(0)}</span>
      )}
    </div>
  );
}
