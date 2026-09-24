"use client";

import { useEffect, useRef } from "react";
import { useAnimate } from "motion/react-mini";
import { XIcon } from "lucide-react";

const DURATION = 0.25; // saniye; KURALLAR 8: en fazla 300 ms

/**
 * Alttan açılan kart (yerleşik <dialog>: odak kilidi, Escape, arka plan hazır).
 * "Azaltılmış hareket" tercihinde animasyon yapılmaz.
 */
export function Sheet({
  open,
  onClose,
  label,
  closeLabel,
  full = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  closeLabel: string;
  /** Tam ekran (arama) */
  full?: boolean;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
      if (!reduced)
        animate(
          scope.current,
          { transform: ["translateY(100%)", "translateY(0)"] },
          { duration: DURATION, ease: "easeOut" },
        );
    } else if (!open && dialog.open) {
      const finish = () => {
        dialog.close();
        document.documentElement.style.overflow = "";
      };
      if (reduced) finish();
      else
        animate(
          scope.current,
          { transform: "translateY(100%)" },
          { duration: DURATION * 0.8, ease: "easeIn" },
        ).then(finish);
    }
  }, [open, animate, scope]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
      className={`m-0 mt-auto h-auto max-h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 open:flex open:flex-col sm:mx-auto sm:max-w-lg ${full ? "" : "pt-12"}`}
    >
      <div
        ref={scope}
        className={
          full
            ? "flex h-dvh w-full flex-col overflow-hidden bg-menu-bg font-menu-body text-menu-ink"
            : "relative flex min-h-0 w-full flex-col overflow-hidden rounded-t-3xl bg-menu-surface font-menu-body text-menu-ink"
        }
      >
        {!full && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute end-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-menu-surface/90 text-menu-ink shadow-sm"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
        )}
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </dialog>
  );
}
