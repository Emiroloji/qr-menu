"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, saveProduct } from "@/actions/product";
import { ConfirmButton } from "@/components/panel/confirm-button";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormAction } from "@/hooks/use-form-action";
import { BADGES, SPICE_LEVELS } from "@/lib/validations/menu";

type Level = "NONE" | "CONTAINS" | "MAY_CONTAIN";

export type ProductFormValues = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  ingredients: string | null;
  portion: string | null;
  origin: string | null;
  prepTime: number | null;
  spiceLevel: number;
  isVisible: boolean;
  isAvailable: boolean;
  badges: (keyof typeof BADGES)[];
  tagIds: string[];
  allergens: Record<string, "CONTAINS" | "MAY_CONTAIN">;
  variants: { name: string | null; price: number }[];
  nutrition: Record<
    "calories" | "protein" | "carbs" | "fat" | "sugar" | "salt",
    number | null
  >;
};

type Option = { id: string; name: string };

const NUTRITION = [
  ["calories", "Kalori (kcal)"],
  ["protein", "Protein (g)"],
  ["carbs", "Karbonhidrat (g)"],
  ["fat", "Yağ (g)"],
  ["sugar", "Şeker (g)"],
  ["salt", "Tuz (g)"],
] as const;

/** Kuruş → "85,50" (forma yazmak için) */
const toInput = (kurus: number) =>
  (kurus / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

function AllergenRow({
  allergen,
  initial,
}: {
  allergen: Option;
  initial: Level;
}) {
  const [level, setLevel] = useState<Level>(initial);
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b py-1 last:border-b-0">
      <span className="text-sm" id={`allergen-${allergen.id}`}>
        {allergen.name}
      </span>
      <input type="hidden" name={`allergen:${allergen.id}`} value={level} />
      <ToggleGroup
        aria-labelledby={`allergen-${allergen.id}`}
        variant="outline"
        size="sm"
        spacing={0}
        value={[level]}
        onValueChange={(value) => value[0] && setLevel(value[0] as Level)}
      >
        <ToggleGroupItem value="NONE">Yok</ToggleGroupItem>
        <ToggleGroupItem value="CONTAINS">İçerir</ToggleGroupItem>
        <ToggleGroupItem value="MAY_CONTAIN">İz</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export function ProductForm({
  product,
  defaultCategoryId,
  categories,
  allergens,
  tags,
  imagesSlot,
}: {
  product?: ProductFormValues;
  defaultCategoryId: string;
  categories: Option[];
  allergens: Option[];
  tags: Option[];
  imagesSlot: React.ReactNode;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState(() =>
    (product?.variants ?? [{ name: null, price: 0 }]).map((v, i) => ({
      key: i,
      name: v.name ?? "",
      price: product ? toInput(v.price) : "",
    })),
  );
  const { pending, error, onSubmit } = useFormAction(saveProduct, ({ id }) => {
    if (product) {
      toast.success("Ürün kaydedildi.");
    } else {
      toast.success("Ürün eklendi. Şimdi görsel ekleyebilirsiniz.");
      router.push(`/panel/menu/products/${id}`);
    }
  });
  const categoryItems = categories.map((c) => ({ value: c.id, label: c.name }));
  const spiceItems = SPICE_LEVELS.map((label, i) => ({
    value: String(i),
    label,
  }));
  const backHref = `/panel/menu?category=${product?.categoryId ?? defaultCategoryId}`;

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temel bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Ürün adı" htmlFor="name">
              <Input
                id="name"
                name="name"
                defaultValue={product?.name}
                required
              />
            </Field>
            <Field label="Kategori" htmlFor="categoryId">
              <Select
                name="categoryId"
                items={categoryItems}
                defaultValue={product?.categoryId ?? defaultCategoryId}
              >
                <SelectTrigger id="categoryId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Açıklama" htmlFor="description">
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={product?.description ?? ""}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Boy ve fiyatlar</CardTitle>
            <CardDescription>
              Tek fiyatlı ürünlerde boy adını boş bırakın. Birden fazla boy
              varsa her birine ad verin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {variants.map((variant, index) => (
              <div key={variant.key} className="flex items-end gap-2">
                <Field
                  label={index === 0 ? "Boy / porsiyon" : ""}
                  htmlFor={`variant-name-${variant.key}`}
                >
                  <Input
                    id={`variant-name-${variant.key}`}
                    name="variantName"
                    placeholder="Örn. Büyük · 450 ml"
                    defaultValue={variant.name}
                    aria-label={`${index + 1}. boy adı`}
                  />
                </Field>
                <div className="w-32 shrink-0">
                  <Field
                    label={index === 0 ? "Fiyat (TL)" : ""}
                    htmlFor={`variant-price-${variant.key}`}
                  >
                    <Input
                      id={`variant-price-${variant.key}`}
                      name="variantPrice"
                      inputMode="decimal"
                      placeholder="0,00"
                      defaultValue={variant.price}
                      aria-label={`${index + 1}. boy fiyatı`}
                      required
                    />
                  </Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`${index + 1}. boyu kaldır`}
                  disabled={variants.length === 1}
                  onClick={() =>
                    setVariants((v) => v.filter((x) => x.key !== variant.key))
                  }
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={variants.length >= 10}
                onClick={() =>
                  setVariants((v) => [
                    ...v,
                    {
                      key: Math.max(...v.map((x) => x.key)) + 1,
                      name: "",
                      price: "",
                    },
                  ])
                }
              >
                <PlusIcon />
                Boy ekle
              </Button>
            </div>
          </CardContent>
        </Card>

        {imagesSlot}

        <Card>
          <CardHeader>
            <CardTitle>Alerjenler</CardTitle>
            <CardDescription>
              Yasal olarak tanımlı 14 alerjen. “İz”: iz miktarda içerebilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-8 md:grid-cols-2">
            {allergens.map((allergen) => (
              <AllergenRow
                key={allergen.id}
                allergen={allergen}
                initial={product?.allergens[allergen.id] ?? "NONE"}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detaylar</CardTitle>
            <CardDescription>
              İsteğe bağlı. Doldurulan alanlar menüde gösterilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="İçindekiler" htmlFor="ingredients">
                <Textarea
                  id="ingredients"
                  name="ingredients"
                  rows={2}
                  defaultValue={product?.ingredients ?? ""}
                />
              </Field>
            </div>
            <Field label="Porsiyon" htmlFor="portion">
              <Input
                id="portion"
                name="portion"
                placeholder="Örn. 350 ml"
                defaultValue={product?.portion ?? ""}
              />
            </Field>
            <Field label="Hazırlanma süresi (dk)" htmlFor="prepTime">
              <Input
                id="prepTime"
                name="prepTime"
                inputMode="numeric"
                defaultValue={product?.prepTime ?? ""}
              />
            </Field>
            <Field label="Menşe" htmlFor="origin">
              <Input
                id="origin"
                name="origin"
                placeholder="Örn. Kolombiya"
                defaultValue={product?.origin ?? ""}
              />
            </Field>
            <Field label="Acılık" htmlFor="spiceLevel">
              <Select
                name="spiceLevel"
                items={spiceItems}
                defaultValue={String(product?.spiceLevel ?? 0)}
              >
                <SelectTrigger id="spiceLevel" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spiceItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {NUTRITION.map(([key, label]) => (
              <Field key={key} label={label} htmlFor={key}>
                <Input
                  id={key}
                  name={key}
                  inputMode="decimal"
                  defaultValue={
                    product?.nutrition[key]?.toString().replace(".", ",") ?? ""
                  }
                />
              </Field>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Durum</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <Checkbox
                id="isVisible"
                name="isVisible"
                defaultChecked={product?.isVisible ?? true}
                className="mt-0.5"
              />
              <Label
                htmlFor="isVisible"
                className="flex flex-col items-start gap-0.5"
              >
                Menüde görünür
                <span className="text-xs font-normal text-muted-foreground">
                  Kapalıysa müşteri görmez.
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="isAvailable"
                name="isAvailable"
                defaultChecked={product?.isAvailable ?? true}
                className="mt-0.5"
              />
              <Label
                htmlFor="isAvailable"
                className="flex flex-col items-start gap-0.5"
              >
                Mevcut
                <span className="text-xs font-normal text-muted-foreground">
                  Kapalıysa “Tükendi” yazar.
                </span>
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Etiketler ve rozetler</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">
                Beslenme etiketleri
              </legend>
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    name="tagIds"
                    value={tag.id}
                    defaultChecked={product?.tagIds.includes(tag.id)}
                  />
                  <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
                </div>
              ))}
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Rozetler</legend>
              {Object.entries(BADGES).map(([value, label]) => (
                <div key={value} className="flex items-center gap-2">
                  <Checkbox
                    id={`badge-${value}`}
                    name="badges"
                    value={value}
                    defaultChecked={product?.badges.includes(
                      value as keyof typeof BADGES,
                    )}
                  />
                  <Label htmlFor={`badge-${value}`}>{label}</Label>
                </div>
              ))}
            </fieldset>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 xl:sticky xl:top-4">
          <FormError error={error} />
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : product ? "Kaydet" : "Ürünü ekle"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
          >
            Menüye dön
          </Button>
          {product && (
            <ConfirmButton
              destructive
              title={`“${product.name}” silinsin mi?`}
              description="Ürün menüden kalkar ve görselleri silinir."
              confirmLabel="Ürünü sil"
              successMessage="Ürün silindi."
              onConfirm={async () => {
                const result = await deleteProduct({ productId: product.id });
                if (result.ok) router.push(backHref);
                return result;
              }}
            >
              Ürünü sil
            </ConfirmButton>
          )}
        </div>
      </div>
    </form>
  );
}
