"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { savePlan } from "@/actions/admin/plan";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";
import {
  APPEARANCE_OPTIONS,
  STATS_OPTIONS,
  type PlanFeatures,
} from "@/lib/validations/plan";

export type PlanFormValues = {
  id: string;
  name: string;
  price: string;
  maxBranches: number | null;
  maxProducts: number | null;
  maxStaff: number | null;
  maxLanguages: number | null;
  features: PlanFeatures;
  isActive: boolean;
};

const LIMITS = [
  ["maxBranches", "Şube"],
  ["maxProducts", "Ürün"],
  ["maxStaff", "Çalışan"],
  ["maxLanguages", "Dil"],
] as const;

function OptionSelect({
  id,
  name,
  options,
  defaultValue,
}: {
  id: string;
  name: string;
  options: Record<string, string>;
  defaultValue: string;
}) {
  const items = Object.entries(options).map(([value, label]) => ({
    value,
    label,
  }));
  return (
    <Select name={name} items={items} defaultValue={defaultValue}>
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

export function PlanForm({ plan }: { plan?: PlanFormValues }) {
  const router = useRouter();
  const { pending, error, onSubmit } = useFormAction(savePlan, () => {
    toast.success(plan ? "Paket güncellendi." : "Paket oluşturuldu.");
    router.push("/admin/plans");
  });

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <Card>
        <CardHeader>
          <CardTitle>Paket</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Paket adı" htmlFor="name">
            <Input id="name" name="name" defaultValue={plan?.name} required />
          </Field>
          <Field label="Fiyat (TL)" htmlFor="price" hint="Örn. 1.499,90">
            <Input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={plan?.price}
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limitler</CardTitle>
          <CardDescription>Boş bırakılan limit sınırsızdır.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {LIMITS.map(([name, label]) => (
            <Field key={name} label={label} htmlFor={name}>
              <Input
                id={name}
                name={name}
                type="number"
                min={1}
                placeholder="Sınırsız"
                defaultValue={plan?.[name] ?? ""}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Özellikler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Görünüm" htmlFor="appearance">
            <OptionSelect
              id="appearance"
              name="appearance"
              options={APPEARANCE_OPTIONS}
              defaultValue={plan?.features.appearance ?? "PRESET"}
            />
          </Field>
          <Field label="İstatistik" htmlFor="stats">
            <OptionSelect
              id="stats"
              name="stats"
              options={STATS_OPTIONS}
              defaultValue={plan?.features.stats ?? "NONE"}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              id="customDomain"
              name="customDomain"
              defaultChecked={plan?.features.customDomain ?? false}
            />
            <Label htmlFor="customDomain">Özel alan adı (Faz 3)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              name="isActive"
              defaultChecked={plan?.isActive ?? true}
            />
            <Label htmlFor="isActive">
              Satışta (yeni aboneliklerde seçilebilir)
            </Label>
          </div>
        </CardContent>
      </Card>

      <FormError error={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
