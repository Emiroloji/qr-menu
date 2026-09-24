"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PlanOption = { id: string; name: string };

export function PlanSelect({
  id,
  plans,
  defaultValue,
}: {
  id: string;
  plans: PlanOption[];
  defaultValue?: string;
}) {
  const items = plans.map((p) => ({ value: p.id, label: p.name }));
  return (
    <Select
      name="planId"
      items={items}
      defaultValue={defaultValue ?? plans[0]?.id}
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
