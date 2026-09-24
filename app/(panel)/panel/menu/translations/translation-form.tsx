"use client";

import { toast } from "sonner";
import { saveTranslations } from "@/actions/translation";
import { FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/hooks/use-form-action";

export function TranslationForm({
  branchId,
  lang,
  children,
}: {
  branchId: string;
  lang: string;
  children: React.ReactNode;
}) {
  const { pending, error, onSubmit } = useFormAction(
    saveTranslations,
    ({ count }) =>
      toast.success(count ? `${count} kayıt güncellendi.` : "Değişiklik yok."),
  );
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="branchId" value={branchId} />
      <input type="hidden" name="lang" value={lang} />
      {children}
      <div className="sticky bottom-20 z-10 flex items-center gap-3 rounded-xl border bg-background p-3 shadow-sm md:bottom-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Çevirileri kaydet"}
        </Button>
        <FormError error={error} />
      </div>
    </form>
  );
}
