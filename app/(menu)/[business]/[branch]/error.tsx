"use client";

import { RefreshCwIcon } from "lucide-react";
import { StatusScreen, statusActionClass } from "@/components/status-screen";

export default function MenuError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <StatusScreen
      icon={<RefreshCwIcon className="size-8" aria-hidden />}
      title="Menü yüklenemedi"
      description="Bağlantınızı kontrol edip tekrar deneyin."
      secondary={
        <span lang="en">The menu could not be loaded. Please try again.</span>
      }
      action={
        <button
          type="button"
          onClick={() => retry()}
          className={statusActionClass}
        >
          Tekrar dene
        </button>
      }
    />
  );
}
