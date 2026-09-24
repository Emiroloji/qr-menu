"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  sendOwnerLoginLink,
  setBusinessActive,
} from "@/actions/admin/business";
import {
  extendSubscription,
  setSubscriptionStatus,
  startSubscription,
} from "@/actions/admin/subscription";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { type PlanOption, PlanSelect } from "../../_components/plan-select";

export function BusinessActiveButton({
  businessId,
  isActive,
}: {
  businessId: string;
  isActive: boolean;
}) {
  if (isActive) {
    return (
      <ConfirmButton
        destructive
        title="İşletme pasif yapılsın mı?"
        description="Menüsü yayından kalkar ve paneli salt okunur olur. Daha sonra tekrar aktif yapabilirsiniz."
        confirmLabel="Pasif yap"
        successMessage="İşletme pasif yapıldı."
        onConfirm={() => setBusinessActive({ businessId, isActive: false })}
      >
        Pasif yap
      </ConfirmButton>
    );
  }
  return (
    <ConfirmButton
      title="İşletme aktif yapılsın mı?"
      description="Aboneliği geçerliyse menüsü yeniden yayına girer."
      confirmLabel="Aktif yap"
      successMessage="İşletme aktif yapıldı."
      onConfirm={() => setBusinessActive({ businessId, isActive: true })}
    >
      Aktif yap
    </ConfirmButton>
  );
}

export function SendLoginLinkButton({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await sendOwnerLoginLink({ businessId });
          if (result.ok) toast.success("Giriş bağlantısı gönderildi.");
          else toast.error(result.error);
        })
      }
    >
      {pending ? "Gönderiliyor…" : "Giriş bağlantısı gönder"}
    </Button>
  );
}

export function SubscriptionStatusButton({
  subscriptionId,
  suspended,
}: {
  subscriptionId: string;
  suspended: boolean;
}) {
  if (suspended) {
    return (
      <ConfirmButton
        title="Abonelik devam ettirilsin mi?"
        description="İşletmenin menüsü yeniden yayına girer."
        confirmLabel="Devam ettir"
        successMessage="Abonelik devam ettirildi."
        onConfirm={() =>
          setSubscriptionStatus({ subscriptionId, status: "ACTIVE" })
        }
      >
        Devam ettir
      </ConfirmButton>
    );
  }
  return (
    <ConfirmButton
      destructive
      title="Abonelik askıya alınsın mı?"
      description="Menü yayından kalkar ve panel salt okunur olur. Bitiş tarihi değişmez."
      confirmLabel="Askıya al"
      successMessage="Abonelik askıya alındı."
      onConfirm={() =>
        setSubscriptionStatus({ subscriptionId, status: "SUSPENDED" })
      }
    >
      Askıya al
    </ConfirmButton>
  );
}

export function ExtendSubscriptionForm({
  subscriptionId,
  defaultEndsAt,
}: {
  subscriptionId: string;
  defaultEndsAt: string;
}) {
  const { pending, error, onSubmit } = useFormAction(extendSubscription, () =>
    toast.success("Abonelik uzatıldı."),
  );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Yeni bitiş tarihi" htmlFor="extendEndsAt">
          <Input
            id="extendEndsAt"
            name="endsAt"
            type="date"
            defaultValue={defaultEndsAt}
            required
          />
        </Field>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Uzat"}
        </Button>
      </div>
      <FormError error={error} />
    </form>
  );
}

export function StartSubscriptionForm({
  businessId,
  plans,
  defaultStartsAt,
  defaultEndsAt,
}: {
  businessId: string;
  plans: PlanOption[];
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const { pending, error, onSubmit } = useFormAction(startSubscription, () =>
    toast.success("Yeni abonelik başlatıldı."),
  );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="businessId" value={businessId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Paket" htmlFor="newPlanId">
          <PlanSelect id="newPlanId" plans={plans} />
        </Field>
        <Field label="Başlangıç" htmlFor="newStartsAt">
          <Input
            id="newStartsAt"
            name="startsAt"
            type="date"
            defaultValue={defaultStartsAt}
            required
          />
        </Field>
        <Field label="Bitiş" htmlFor="newEndsAt">
          <Input
            id="newEndsAt"
            name="endsAt"
            type="date"
            defaultValue={defaultEndsAt}
            required
          />
        </Field>
      </div>
      <FormError error={error} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Başlatılıyor…" : "Aboneliği başlat"}
        </Button>
      </div>
    </form>
  );
}
