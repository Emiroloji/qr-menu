"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBusiness } from "@/actions/admin/business";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { slugify } from "@/lib/format";
import { type PlanOption, PlanSelect } from "../../_components/plan-select";

export function BusinessForm({
  plans,
  defaultStartsAt,
  defaultEndsAt,
}: {
  plans: PlanOption[];
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const { pending, error, onSubmit } = useFormAction(
    createBusiness,
    ({ id }) => {
      toast.success("İşletme oluşturuldu, sahibine e-posta gönderildi.");
      router.push(`/admin/businesses/${id}`);
    },
  );

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>İşletme</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="İşletme adı" htmlFor="name">
            <Input
              id="name"
              name="name"
              required
              onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
            />
          </Field>
          <Field
            label="Menü adresi"
            htmlFor="slug"
            hint={`Menü: /${slug || "isletme-adi"}/şube`}
          >
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
              }}
              className="font-mono"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İşletme sahibi</CardTitle>
          <CardDescription>
            Bu adrese “şifrenizi belirleyin” bağlantısı gider (24 saat geçerli).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad soyad" htmlFor="ownerName">
            <Input
              id="ownerName"
              name="ownerName"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="E-posta" htmlFor="ownerEmail">
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              autoComplete="off"
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paket ve abonelik</CardTitle>
          <CardDescription>
            Ödeme manuel alınır; abonelik burada başlatılır.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Paket" htmlFor="planId">
            <PlanSelect id="planId" plans={plans} />
          </Field>
          <Field label="Başlangıç" htmlFor="startsAt">
            <Input
              id="startsAt"
              name="startsAt"
              type="date"
              defaultValue={defaultStartsAt}
              required
            />
          </Field>
          <Field label="Bitiş" htmlFor="endsAt">
            <Input
              id="endsAt"
              name="endsAt"
              type="date"
              defaultValue={defaultEndsAt}
              required
            />
          </Field>
        </CardContent>
      </Card>

      <FormError error={error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Oluşturuluyor…" : "İşletmeyi oluştur"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
