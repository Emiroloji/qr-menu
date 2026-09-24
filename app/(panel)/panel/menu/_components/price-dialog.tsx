"use client";

import { useState, useTransition } from "react";
import { BanknoteIcon } from "lucide-react";
import { toast } from "sonner";
import { updateVariantPrices } from "@/actions/product";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/** Kuruş → "85,50" */
const toInput = (kurus: number) =>
  (kurus / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

/** Yalnızca fiyat yetkisi olan çalışan için: ürünün boy fiyatlarını değiştirir. */
export function PriceDialog({
  product,
}: {
  product: {
    id: string;
    name: string;
    variants: { id: string; name: string | null; price: number }[];
  };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const prices = product.variants.map((v) => ({
      variantId: v.id,
      price: String(form.get(v.id) ?? ""),
    }));
    setError(null);
    startTransition(async () => {
      const result = await updateVariantPrices({
        productId: product.id,
        prices,
      });
      if (result.ok) {
        toast.success("Fiyat güncellendi.");
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${product.name} fiyatını değiştir`}
          />
        }
      >
        <BanknoteIcon />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.name} · fiyat</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {product.variants.map((variant) => (
            <Field
              key={variant.id}
              label={variant.name ? `${variant.name} (TL)` : "Fiyat (TL)"}
              htmlFor={variant.id}
            >
              <Input
                id={variant.id}
                name={variant.id}
                inputMode="decimal"
                defaultValue={toInput(variant.price)}
                required
              />
            </Field>
          ))}
          <FormError error={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
