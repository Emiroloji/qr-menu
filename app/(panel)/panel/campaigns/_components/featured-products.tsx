"use client";

import { useState, useTransition } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { setProductFeatured } from "@/actions/campaign";
import { Field } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { MAX_FEATURED_PRODUCTS } from "@/lib/campaigns";
import { type ProductOption, ProductSelect } from "./product-select";

/** Menünün "Öne çıkanlar" alanındaki ürünler. */
export function FeaturedProducts({
  products,
  featured,
}: {
  /** Henüz öne çıkarılmamış ürünler */
  products: ProductOption[];
  featured: ProductOption[];
}) {
  const [productId, setProductId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const full = featured.length >= MAX_FEATURED_PRODUCTS;

  function update(id: string, isFeatured: boolean) {
    startTransition(async () => {
      const result = await setProductFeatured({ productId: id, isFeatured });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        isFeatured ? "Ürün öne çıkarıldı." : "Ürün öne çıkanlardan çıkarıldı.",
      );
      if (isFeatured) setProductId(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          label="Ürün ekle"
          htmlFor="featured-product"
          hint={`En fazla ${MAX_FEATURED_PRODUCTS} ürün. Menüdeki sıralarıyla gösterilir.`}
        >
          <ProductSelect
            id="featured-product"
            products={products}
            value={productId}
            onValueChange={setProductId}
          />
        </Field>
        <Button
          type="button"
          disabled={pending || !productId || full}
          onClick={() => productId && update(productId, true)}
          className="sm:mb-6"
        >
          Öne çıkar
        </Button>
      </div>

      {featured.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Henüz öne çıkan ürün yok. Eklediğiniz ürünler menünün üstünde yatay
          bir şeritte görünür.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {featured.map((p) => (
            <li
              key={p.id}
              className="flex h-9 items-center gap-1 rounded-full border bg-background ps-3 pe-1 text-sm"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">· {p.category}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                aria-label={`${p.name} öne çıkanlardan çıkar`}
                onClick={() => update(p.id, false)}
                className="rounded-full"
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
