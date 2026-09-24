"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, ImageIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import {
  reorderProducts,
  setProductAvailability,
  setProductVisibility,
} from "@/actions/product";
import { SortableList } from "@/components/panel/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/format";
import { productImageSrc } from "@/lib/product-image";
import { cn } from "@/lib/utils";
import { BADGES } from "@/lib/validations/menu";

export type ProductItem = {
  id: string;
  name: string;
  isAvailable: boolean;
  isVisible: boolean;
  badges: (keyof typeof BADGES)[];
  prices: number[];
  variantCount: number;
  image: { url: string; blurDataUrl: string | null } | null;
};

type Permissions = { edit: boolean; toggle: boolean };

function priceLabel(prices: number[]) {
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)} – ${formatPrice(max)}`;
}

function AvailabilitySwitch({
  product,
  enabled,
}: {
  product: ProductItem;
  enabled: boolean;
}) {
  const [available, setAvailable] = useState(product.isAvailable);
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex min-h-10 items-center gap-2 text-xs font-medium">
      <Switch
        checked={available}
        disabled={!enabled || pending}
        aria-label={`${product.name} mevcut`}
        onCheckedChange={(checked) => {
          setAvailable(checked);
          startTransition(async () => {
            const result = await setProductAvailability({
              productId: product.id,
              isAvailable: checked,
            });
            if (!result.ok) {
              setAvailable(!checked);
              toast.error(result.error);
            }
          });
        }}
      />
      <span
        className={cn(
          "w-14",
          available ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {available ? "Mevcut" : "Tükendi"}
      </span>
    </label>
  );
}

function VisibilityButton({ product }: { product: ProductItem }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label={
        product.isVisible ? `${product.name} gizle` : `${product.name} göster`
      }
      title={product.isVisible ? "Menüde görünüyor" : "Gizli"}
      onClick={() =>
        startTransition(async () => {
          const result = await setProductVisibility({
            productId: product.id,
            isVisible: !product.isVisible,
          });
          if (result.ok)
            toast.success(
              product.isVisible ? "Ürün gizlendi." : "Ürün menüde görünüyor.",
            );
          else toast.error(result.error);
        })
      }
    >
      {product.isVisible ? (
        <EyeIcon />
      ) : (
        <EyeOffIcon className="text-muted-foreground" />
      )}
    </Button>
  );
}

export function ProductList({
  categoryId,
  products,
  permissions,
}: {
  categoryId: string;
  products: ProductItem[];
  permissions: Permissions;
}) {
  return (
    <SortableList
      key={products
        .map((p) => `${p.id}:${p.isVisible}:${p.isAvailable}`)
        .join()}
      items={products}
      disabled={!permissions.edit}
      onReorder={(ids) => reorderProducts({ parentId: categoryId, ids })}
      className="flex flex-col divide-y"
    >
      {(product, handle) => (
        <div
          className={cn(
            "flex items-center gap-2 bg-background py-2 pr-2",
            !handle && "pl-3",
          )}
        >
          {handle}
          <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
            {product.image ? (
              <Image
                src={productImageSrc(product.image.url, 400)}
                alt={product.name}
                fill
                sizes="48px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <ImageIcon
                className="absolute inset-0 m-auto size-5 text-muted-foreground"
                aria-hidden
              />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {permissions.edit ? (
                <Link
                  href={`/panel/menu/products/${product.id}`}
                  className="truncate font-medium hover:underline"
                >
                  {product.name}
                </Link>
              ) : (
                <span className="truncate font-medium">{product.name}</span>
              )}
              {!product.isVisible && <Badge variant="secondary">Gizli</Badge>}
              {product.badges.map((b) => (
                <Badge key={b} variant="outline">
                  {BADGES[b]}
                </Badge>
              ))}
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              {priceLabel(product.prices)}
              {product.variantCount > 1 && ` · ${product.variantCount} boy`}
            </span>
          </div>
          <AvailabilitySwitch product={product} enabled={permissions.toggle} />
          {permissions.edit && (
            <>
              <VisibilityButton product={product} />
              <Link
                href={`/panel/menu/products/${product.id}`}
                aria-label={`${product.name} düzenle`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "hidden sm:inline-flex",
                )}
              >
                <PencilIcon />
              </Link>
            </>
          )}
        </div>
      )}
    </SortableList>
  );
}
