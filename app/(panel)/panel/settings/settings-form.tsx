"use client";

import { toast } from "sonner";
import { updateBusinessSettings } from "@/actions/business";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";

export function SettingsForm({ name, slug }: { name: string; slug: string }) {
  const { pending, error, onSubmit } = useFormAction(
    updateBusinessSettings,
    () => toast.success("İşletme bilgileri kaydedildi."),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genel</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="İşletme adı" htmlFor="name">
            <Input id="name" name="name" defaultValue={name} required />
          </Field>
          <Field
            label="Menü adresi"
            htmlFor="slug"
            hint="Basılı QR kodlar bu adresi kullandığı için değiştirilemez."
          >
            <Input
              id="slug"
              value={`/${slug}`}
              readOnly
              disabled
              className="font-mono"
            />
          </Field>
          <FormError error={error} />
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
