import type { Metadata } from "next";
import { QrCodeIcon } from "lucide-react";
import { StatusScreen } from "@/components/status-screen";

export const metadata: Metadata = {
  title: "Menü bulunamadı",
  robots: { index: false },
};

/** Menü adresi yanlış veya şube kaldırılmış. */
export default function MenuNotFound() {
  return (
    <StatusScreen
      icon={<QrCodeIcon className="size-8" aria-hidden />}
      title="Menü bulunamadı"
      description="QR kodu yeniden okutmayı deneyin veya personelden yardım isteyin."
      secondary={
        <span lang="en">
          Menu not found. Please scan the QR code again or ask a member of
          staff.
        </span>
      }
    />
  );
}
