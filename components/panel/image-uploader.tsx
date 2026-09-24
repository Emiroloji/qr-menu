"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActionResult } from "@/lib/action";
import { cn } from "@/lib/utils";

/** Tek görsel yükleme kartı (logo, kapak, kampanya). Dosya `/api/upload?kind=…` ile gönderilir. */
export function ImageUploader({
  kind,
  params,
  title,
  description,
  imageUrl,
  alt,
  wide = false,
  unavailableMessage,
  onRemove,
}: {
  kind: "logo" | "cover" | "campaign";
  /** Yükleme adresine eklenecek parametreler, ör. `campaignId=…` */
  params?: string;
  title: string;
  description: string;
  imageUrl: string | null;
  alt: string;
  wide?: boolean;
  /** Paket bu özelliği içermiyorsa gösterilecek açıklama */
  unavailableMessage?: string;
  onRemove: () => Promise<ActionResult<null>>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);
    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(
        `/api/upload?kind=${kind}${params ? `&${params}` : ""}`,
        {
          method: "POST",
          body,
        },
      );
      const result: { error?: string } = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Görsel yüklenemedi. Lütfen tekrar deneyin.");
        return;
      }
      toast.success(`${title} güncellendi.`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{unavailableMessage ?? description}</CardDescription>
      </CardHeader>
      {!unavailableMessage && (
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted",
              wide ? "aspect-video w-full sm:w-64" : "size-24",
            )}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={alt}
                fill
                sizes={wide ? "256px" : "96px"}
                className={wide ? "object-cover" : "object-contain"}
              />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label={`${title} dosyası seç`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
              >
                <UploadIcon />
                {pending ? "Yükleniyor…" : imageUrl ? "Değiştir" : "Yükle"}
              </Button>
              {imageUrl && (
                <ConfirmButton
                  destructive
                  title={`${title} kaldırılsın mı?`}
                  description="Menüde artık gösterilmez."
                  confirmLabel="Kaldır"
                  successMessage={`${title} kaldırıldı.`}
                  onConfirm={onRemove}
                >
                  Kaldır
                </ConfirmButton>
              )}
            </div>
            <FormError error={error} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
