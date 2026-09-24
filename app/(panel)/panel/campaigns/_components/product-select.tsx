"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ProductOption = { id: string; name: string; category: string };

/** Şubenin ürünleri, kategorilere göre gruplanmış. */
export function ProductSelect({
  id,
  name,
  products,
  value,
  onValueChange,
}: {
  id: string;
  name?: string;
  products: ProductOption[];
  value?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  const items = [
    { value: null, label: "Ürün seçin" },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];
  const groups = new Map<string, ProductOption[]>();
  for (const p of products)
    groups.set(p.category, [...(groups.get(p.category) ?? []), p]);
  return (
    <Select
      name={name}
      items={items}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[...groups].map(([category, list]) => (
          <SelectGroup key={category}>
            <SelectLabel>{category}</SelectLabel>
            {list.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
