"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createStaff,
  deleteStaff,
  sendStaffLoginLink,
  updateStaff,
} from "@/actions/staff";
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
import { useFormAction } from "@/hooks/use-form-action";
import type { Permission } from "@/lib/generated/prisma/enums";
import { MENU_PERMISSIONS, PERMISSION_LABELS } from "@/lib/permissions";

export type StaffValues = {
  id: string;
  name: string;
  email: string;
  permissions: Permission[];
  hasPassword: boolean;
};

export function StaffForm({ staff }: { staff?: StaffValues }) {
  const router = useRouter();
  const [sending, startSending] = useTransition();
  const create = useFormAction(createStaff, () => {
    toast.success(
      "Çalışan eklendi, e-posta adresine giriş bağlantısı gönderildi.",
    );
    router.push("/panel/staff");
  });
  const update = useFormAction(updateStaff, () =>
    toast.success("Çalışan kaydedildi."),
  );
  const { pending, error, onSubmit } = staff ? update : create;

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-6">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <Card>
        <CardHeader>
          <CardTitle>Çalışan</CardTitle>
          {!staff && (
            <CardDescription>
              Çalışana “şifrenizi belirleyin” bağlantısı gönderilir (24 saat
              geçerli).
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad soyad" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={staff?.name}
              autoComplete="off"
              required
            />
          </Field>
          <Field
            label="E-posta"
            htmlFor="email"
            hint={
              staff
                ? "E-posta değiştirilemez; gerekirse çalışanı silip yeniden ekleyin."
                : undefined
            }
          >
            <Input
              id="email"
              name={staff ? undefined : "email"}
              type="email"
              defaultValue={staff?.email}
              disabled={Boolean(staff)}
              autoComplete="off"
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yetkiler</CardTitle>
          <CardDescription>
            Çalışan yalnızca izin verdiğiniz işleri yapabilir ve yalnızca ilgili
            ekranları görür. Şube, çalışan, görünüm ve paket ayarlarına hiçbir
            durumda erişemez.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {MENU_PERMISSIONS.map((permission) => (
            <div key={permission} className="flex items-start gap-3">
              <Checkbox
                id={permission}
                name="permissions"
                value={permission}
                defaultChecked={staff?.permissions.includes(permission)}
                className="mt-0.5"
              />
              <Label
                htmlFor={permission}
                className="flex flex-col items-start gap-0.5"
              >
                {PERMISSION_LABELS[permission].label}
                <span className="text-xs font-normal text-muted-foreground">
                  {PERMISSION_LABELS[permission].description}
                </span>
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <FormError error={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : staff ? "Kaydet" : "Çalışanı ekle"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/panel/staff")}
        >
          Vazgeç
        </Button>
        {staff && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={sending}
              onClick={() =>
                startSending(async () => {
                  const result = await sendStaffLoginLink({
                    staffId: staff.id,
                  });
                  if (result.ok) toast.success("Giriş bağlantısı gönderildi.");
                  else toast.error(result.error);
                })
              }
            >
              {sending ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
            </Button>
            <div className="ml-auto">
              <ConfirmButton
                destructive
                title={`${staff.name} silinsin mi?`}
                description="Hesabı silinir ve panelden hemen çıkarılır. Bu işlem geri alınamaz."
                confirmLabel="Çalışanı sil"
                successMessage="Çalışan silindi."
                onConfirm={async () => {
                  const result = await deleteStaff({ staffId: staff.id });
                  if (result.ok) router.push("/panel/staff");
                  return result;
                }}
              >
                Çalışanı sil
              </ConfirmButton>
            </div>
          </>
        )}
      </div>
    </form>
  );
}
