"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

/** Şube seçimi; diğer seçimler (dönem, aralık) adreste korunur. */
export function StatsBranchSelect({
  branches,
  value,
}: {
  branches: { id: string; name: string }[];
  value: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = [
    { value: ALL, label: "Tüm şubeler" },
    ...branches.map((b) => ({ value: b.id, label: `${b.name} şubesi` })),
  ];
  return (
    <Select
      items={items}
      value={value ?? ALL}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams);
        if (!next || next === ALL) params.delete("branch");
        else params.set("branch", next);
        router.push(`${pathname}?${params}`, { scroll: false });
      }}
    >
      <SelectTrigger aria-label="Şube seç" className="h-9 min-w-44">
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
