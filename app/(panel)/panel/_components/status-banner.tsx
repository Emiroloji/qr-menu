import { TriangleAlertIcon } from "lucide-react";
import {
  type BusinessStatus,
  daysUntil,
  isBusinessOperational,
  READ_ONLY_MESSAGES,
} from "@/lib/business-status";
import { formatDate } from "@/lib/format";

/** Abonelik bitişine az kaldığında veya panel salt okunurken tüm sayfalarda görünür. */
export function StatusBanner({
  status,
  endsAt,
}: {
  status: BusinessStatus;
  endsAt?: Date;
}) {
  if (status === "ACTIVE") return null;

  if (isBusinessOperational(status)) {
    const daysLeft = endsAt ? daysUntil(endsAt) : 0;
    return (
      <div
        role="status"
        className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 md:px-8 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
      >
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
        <p>
          <strong>
            Aboneliğinizin bitmesine {daysLeft} gün kaldı
            {endsAt && ` (${formatDate(endsAt)})`}.
          </strong>{" "}
          Süre dolduğunda menünüz yayından kalkar. Uzatmak için bizimle
          iletişime geçin.
        </p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950 md:px-8 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
      <p>
        <strong>{READ_ONLY_MESSAGES[status]}</strong> Lütfen bizimle iletişime
        geçin.
      </p>
    </div>
  );
}
