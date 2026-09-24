"use client";

import { useState } from "react";
import { PercentIcon } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdatePrices } from "@/actions/menu";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import { formatPrice } from "@/lib/format";
import { applyPriceChange, type PriceChange } from "@/lib/pricing";

function Choice({
  id,
  name,
  items,
  value,
  onChange,
}: {
  id: string;
  name: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      name={name}
      items={items}
      value={value}
      onValueChange={(v) => v && onChange(v)}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BulkPriceDialog({
  branchId,
  category,
  samplePrice,
}: {
  branchId: string;
  category: { id: string; name: string } | null;
  samplePrice: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("ALL");
  const [direction, setDirection] =
    useState<PriceChange["direction"]>("INCREASE");
  const [mode, setMode] = useState<PriceChange["mode"]>("PERCENT");
  const [rounding, setRounding] = useState("100");
  const [value, setValue] = useState("");
  const { pending, error, onSubmit } = useFormAction(
    bulkUpdatePrices,
    ({ count }) => {
      toast.success(`${count} fiyat güncellendi.`);
      setOpen(false);
      setValue("");
    },
  );

  const numeric = Number(value.replace(",", "."));
  const preview =
    samplePrice !== null && numeric > 0
      ? applyPriceChange(samplePrice, {
          direction,
          mode,
          value: mode === "AMOUNT" ? Math.round(numeric * 100) : numeric,
          rounding: Number(rounding),
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PercentIcon />
        Toplu fiyat
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Toplu fiyat güncelleme</DialogTitle>
          <DialogDescription>
            Tüm boyların fiyatlarına zam veya indirim uygulanır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="branchId" value={branchId} />
          <Field label="Kapsam" htmlFor="bulk-scope">
            <Choice
              id="bulk-scope"
              name="categoryId"
              value={scope}
              onChange={setScope}
              items={[
                { value: "ALL", label: "Bu şubedeki tüm ürünler" },
                ...(category
                  ? [
                      {
                        value: category.id,
                        label: `Yalnızca “${category.name}”`,
                      },
                    ]
                  : []),
              ]}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="İşlem" htmlFor="bulk-direction">
              <Choice
                id="bulk-direction"
                name="direction"
                value={direction}
                onChange={(v) => setDirection(v as PriceChange["direction"])}
                items={[
                  { value: "INCREASE", label: "Zam" },
                  { value: "DECREASE", label: "İndirim" },
                ]}
              />
            </Field>
            <Field label="Tür" htmlFor="bulk-mode">
              <Choice
                id="bulk-mode"
                name="mode"
                value={mode}
                onChange={(v) => setMode(v as PriceChange["mode"])}
                items={[
                  { value: "PERCENT", label: "Yüzde (%)" },
                  { value: "AMOUNT", label: "Tutar (TL)" },
                ]}
              />
            </Field>
            <Field
              label={mode === "PERCENT" ? "Oran (%)" : "Tutar (TL)"}
              htmlFor="bulk-value"
            >
              <Input
                id="bulk-value"
                name="value"
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === "PERCENT" ? "10" : "5"}
                required
              />
            </Field>
            <Field label="Yuvarlama" htmlFor="bulk-rounding">
              <Choice
                id="bulk-rounding"
                name="rounding"
                value={rounding}
                onChange={setRounding}
                items={[
                  { value: "0", label: "Yok" },
                  { value: "50", label: "0,50 TL" },
                  { value: "100", label: "1 TL" },
                  { value: "500", label: "5 TL" },
                ]}
              />
            </Field>
          </div>
          {preview !== null && samplePrice !== null && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm tabular-nums">
              Örnek: {formatPrice(samplePrice)} →{" "}
              <strong>{formatPrice(preview)}</strong>
            </p>
          )}
          <FormError error={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uygulanıyor…" : "Fiyatları güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
