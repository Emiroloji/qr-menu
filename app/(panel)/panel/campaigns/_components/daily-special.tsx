"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteDailySpecial, saveDailySpecial } from "@/actions/campaign";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { type ProductOption, ProductSelect } from "./product-select";

export type SpecialRow = {
  id: string;
  dateLabel: string;
  productName: string;
  isToday: boolean;
};

/** Günün önerisi: bugüne veya ileri bir güne ürün atama ve planlanmış öneriler. */
export function DailySpecial({
  branchId,
  products,
  specials,
  today,
  lastDay,
}: {
  branchId: string;
  products: ProductOption[];
  specials: SpecialRow[];
  /** "YYYY-MM-DD" (Türkiye saatiyle) */
  today: string;
  lastDay: string;
}) {
  const [productId, setProductId] = useState<string | null>(null);
  const { pending, error, onSubmit } = useFormAction(saveDailySpecial, () => {
    toast.success("Günün önerisi kaydedildi.");
    setProductId(null);
  });

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="branchId" value={branchId} />
        <Field label="Gün" htmlFor="special-date">
          <Input
            id="special-date"
            name="date"
            type="date"
            defaultValue={today}
            min={today}
            max={lastDay}
            required
          />
        </Field>
        <Field label="Ürün" htmlFor="special-product">
          <ProductSelect
            id="special-product"
            name="productId"
            products={products}
            value={productId}
            onValueChange={setProductId}
          />
        </Field>
        <Button type="submit" disabled={pending || !productId}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        <div className="sm:col-span-3">
          <FormError error={error} />
        </div>
      </form>

      {specials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Planlanmış öneri yok. Bugün için bir ürün seçerseniz menünün üstünde
          “Günün önerisi” olarak görünür.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {specials.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3"
            >
              <div className="flex flex-col text-sm">
                <span className="font-medium">{s.productName}</span>
                <span className="text-muted-foreground">
                  {s.dateLabel}
                  {s.isToday && " · şu an menüde"}
                </span>
              </div>
              <ConfirmButton
                title="Öneri kaldırılsın mı?"
                description={`${s.dateLabel} için ${s.productName} önerisi kaldırılır.`}
                confirmLabel="Kaldır"
                successMessage="Öneri kaldırıldı."
                onConfirm={() => deleteDailySpecial({ specialId: s.id })}
              >
                Kaldır
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
