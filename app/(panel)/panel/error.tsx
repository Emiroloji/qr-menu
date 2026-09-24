"use client";

import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Beklenmeyen hata: teknik ayrıntı gösterilmez (KURALLAR 5); hata sunucu kayıtlarına düşer. */
export default function AreaError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-xl border bg-background p-6"
    >
      <div className="flex items-center gap-2">
        <TriangleAlertIcon className="size-5 text-destructive" aria-hidden />
        <h1 className="text-lg font-semibold">Bir şeyler ters gitti</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        İşleminiz tamamlanamadı. Tekrar deneyin; sorun sürerse bizimle iletişime
        geçin.
        {error.digest && (
          <span className="mt-1 block font-mono text-xs">
            Hata kodu: {error.digest}
          </span>
        )}
      </p>
      <Button onClick={() => retry()}>Tekrar dene</Button>
    </div>
  );
}
