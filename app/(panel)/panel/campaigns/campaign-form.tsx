"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCampaign } from "@/actions/campaign";
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

export type CampaignValues = {
  id: string;
  title: string;
  description: string | null;
  /** "YYYY-MM-DD" */
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  translations: Record<string, { name?: string; description?: string }>;
};

export function CampaignForm({
  branchId,
  campaign,
  languages,
  defaultDates,
}: {
  branchId: string;
  campaign?: CampaignValues;
  /** Şubenin Türkçe dışındaki dilleri */
  languages: { code: string; name: string }[];
  defaultDates: { startsAt: string; endsAt: string };
}) {
  const router = useRouter();
  const { pending, error, onSubmit } = useFormAction(saveCampaign, ({ id }) => {
    if (campaign) {
      toast.success("Kampanya kaydedildi.");
      return;
    }
    toast.success("Kampanya eklendi. Şimdi görsel ekleyebilirsiniz.");
    router.push(`/panel/campaigns/${id}`);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {campaign ? (
        <input type="hidden" name="id" value={campaign.id} />
      ) : (
        <input type="hidden" name="branchId" value={branchId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kampanya bilgileri</CardTitle>
          <CardDescription>
            Kampanya, tarih aralığında menünün üstünde banner olarak görünür.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Başlık" htmlFor="title">
              <Input
                id="title"
                name="title"
                defaultValue={campaign?.title}
                placeholder="Örn. Hafta içi 15:00–17:00 tatlılarda %20"
                maxLength={80}
                required
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Açıklama (isteğe bağlı)" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={2}
                maxLength={200}
                defaultValue={campaign?.description ?? ""}
              />
            </Field>
          </div>
          <Field label="Başlangıç" htmlFor="startsAt">
            <Input
              id="startsAt"
              name="startsAt"
              type="date"
              defaultValue={campaign?.startsAt ?? defaultDates.startsAt}
              required
            />
          </Field>
          <Field label="Bitiş (bu gün dahil)" htmlFor="endsAt">
            <Input
              id="endsAt"
              name="endsAt"
              type="date"
              defaultValue={campaign?.endsAt ?? defaultDates.endsAt}
              required
            />
          </Field>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="isActive"
              name="isActive"
              defaultChecked={campaign?.isActive ?? true}
            />
            <Label htmlFor="isActive">
              Açık (kapatırsanız tarih aralığında da görünmez)
            </Label>
          </div>
        </CardContent>
      </Card>

      {languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Çeviriler</CardTitle>
            <CardDescription>
              Boş bırakılan alan menüde Türkçe görünür.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {languages.map((l) => (
              <fieldset key={l.code} className="grid gap-4 sm:grid-cols-2">
                <legend className="mb-2 text-sm font-medium">{l.name}</legend>
                <Field label="Başlık" htmlFor={`name-${l.code}`}>
                  <Input
                    id={`name-${l.code}`}
                    name={`name:${l.code}`}
                    maxLength={200}
                    defaultValue={campaign?.translations[l.code]?.name ?? ""}
                  />
                </Field>
                <Field label="Açıklama" htmlFor={`description-${l.code}`}>
                  <Input
                    id={`description-${l.code}`}
                    name={`description:${l.code}`}
                    maxLength={200}
                    defaultValue={
                      campaign?.translations[l.code]?.description ?? ""
                    }
                  />
                </Field>
              </fieldset>
            ))}
          </CardContent>
        </Card>
      )}

      <FormError error={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : campaign ? "Kaydet" : "Kampanyayı ekle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/panel/campaigns?branch=${branchId}`)}
        >
          {campaign ? "Listeye dön" : "Vazgeç"}
        </Button>
      </div>
    </form>
  );
}
