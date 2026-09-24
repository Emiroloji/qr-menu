"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BranchSwitcher({
  branches,
  value,
  basePath = "/panel/menu",
}: {
  branches: { id: string; name: string }[];
  value: string;
  basePath?: string;
}) {
  const router = useRouter();
  const items = branches.map((b) => ({
    value: b.id,
    label: `${b.name} şubesi`,
  }));
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(branchId) =>
        branchId && router.push(`${basePath}?branch=${branchId}`)
      }
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
