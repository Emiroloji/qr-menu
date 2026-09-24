"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteBranch, saveBranch } from "@/actions/branch";
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
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";
import { slugify } from "@/lib/format";
import {
  DAYS,
  type OpeningHours,
  SOCIALS,
  type Socials,
} from "@/lib/validations/branch";

export type BranchFormValues = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  wifi: string | null;
  openingHours: OpeningHours;
  socials: Socials;
};

const DEFAULT_RANGE: [string, string] = ["09:00", "22:00"];

export function BranchForm({
  branch,
  businessSlug,
}: {
  branch?: BranchFormValues;
  businessSlug: string;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(branch?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(branch));
  const [openDays, setOpenDays] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      DAYS.map(([day]) => [
        day,
        branch ? Boolean(branch.openingHours[day]?.length) : true,
      ]),
    ),
  );
  const { pending, error, onSubmit } = useFormAction(saveBranch, ({ id }) => {
    toast.success(branch ? "Şube kaydedildi." : "Şube eklendi.");
    if (!branch) router.push(`/panel/branches/${id}`);
  });

  return (
    <form onSubmit={onSubmit} className="grid max-w-3xl gap-6">
      {branch && <input type="hidden" name="id" value={branch.id} />}

      <Card>
        <CardHeader>
          <CardTitle>Şube</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Şube adı" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={branch?.name}
              placeholder="Örn. Kadıköy"
              required
              onChange={(e) => !slugEdited && setSlug(slugify(e.target.value))}
            />
          </Field>
          <Field
            label="Menü adresi"
            htmlFor="slug"
            hint={
              branch
                ? "Değiştirirseniz basılı QR kodlar çalışmaz."
                : `Menü: /${businessSlug}/${slug || "sube"}`
            }
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
          <CardTitle>İletişim</CardTitle>
          <CardDescription>Menünün üst kısmında gösterilir.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Adres" htmlFor="address">
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={branch?.address ?? ""}
              />
            </Field>
          </div>
          <Field label="Telefon" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={branch?.phone ?? ""}
            />
          </Field>
          <Field
            label="Wi-Fi"
            htmlFor="wifi"
            hint="Ağ adı ve şifre, örn. LimonKafe / 12345678"
          >
            <Input id="wifi" name="wifi" defaultValue={branch?.wifi ?? ""} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Çalışma saatleri</CardTitle>
          <CardDescription>
            Gece yarısını geçen saatler için kapanışı küçük yazın (ör. 18:00 –
            02:00).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {DAYS.map(([day, label]) => {
            const open = openDays[day];
            const [from, to] = branch?.openingHours[day]?.[0] ?? DEFAULT_RANGE;
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-2">
                <div className="flex w-36 items-center gap-2">
                  <Checkbox
                    id={`${day}_open`}
                    name={`${day}_open`}
                    checked={open}
                    onCheckedChange={(checked) =>
                      setOpenDays((d) => ({ ...d, [day]: checked }))
                    }
                  />
                  <Label htmlFor={`${day}_open`}>{label}</Label>
                </div>
                {open ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      name={`${day}_from`}
                      defaultValue={from}
                      aria-label={`${label} açılış`}
                      className="w-32"
                      required
                    />
                    <span aria-hidden>–</span>
                    <Input
                      type="time"
                      name={`${day}_to`}
                      defaultValue={to}
                      aria-label={`${label} kapanış`}
                      className="w-32"
                      required
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Kapalı</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sosyal medya</CardTitle>
          <CardDescription>
            Kullanıcı adı (@limonkafe) veya tam adres girebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {SOCIALS.map(([key, label]) => (
            <Field key={key} label={label} htmlFor={key}>
              <Input
                id={key}
                name={key}
                defaultValue={branch?.socials[key] ?? ""}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      <FormError error={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : branch ? "Kaydet" : "Şubeyi ekle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/panel/branches")}
        >
          Vazgeç
        </Button>
        {branch && (
          <div className="ml-auto">
            <ConfirmButton
              destructive
              title="Şube silinsin mi?"
              description="Şubenin menüsü yayından kalkar ve QR kodu çalışmaz. Yanlışlıkla silinen şube destek ekibi tarafından geri getirilebilir."
              confirmLabel="Şubeyi sil"
              successMessage="Şube silindi."
              onConfirm={async () => {
                const result = await deleteBranch({ branchId: branch.id });
                if (result.ok) router.push("/panel/branches");
                return result;
              }}
            >
              Şubeyi sil
            </ConfirmButton>
          </div>
        )}
      </div>
    </form>
  );
}
