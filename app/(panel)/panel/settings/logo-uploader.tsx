"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { removeLogo } from "@/actions/business";
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

export function LogoUploader({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);
    startTransition(async () => {
      const body = new FormData();
      body.set("kind", "logo");
      body.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const result: { url?: string; error?: string } = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "Logo yüklenemedi. Lütfen tekrar deneyin.");
        return;
      }
      toast.success("Logo güncellendi.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo</CardTitle>
        <CardDescription>
          JPEG, PNG veya WebP · en fazla 10 MB. Kare logolar en iyi görünür.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logosu`}
              width={96}
              height={96}
              className="size-full object-contain"
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
            aria-label="Logo dosyası seç"
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
              {pending
                ? "Yükleniyor…"
                : logoUrl
                  ? "Logoyu değiştir"
                  : "Logo yükle"}
            </Button>
            {logoUrl && (
              <ConfirmButton
                destructive
                title="Logo kaldırılsın mı?"
                description="Menüde logo yerine işletme adının baş harfi görünür."
                confirmLabel="Kaldır"
                successMessage="Logo kaldırıldı."
                onConfirm={removeLogo}
              >
                Kaldır
              </ConfirmButton>
            )}
          </div>
          <FormError error={error} />
        </div>
      </CardContent>
    </Card>
  );
}
