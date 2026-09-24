import { Badge } from "@/components/ui/badge";
import {
  BUSINESS_STATUS_LABELS,
  type BusinessStatus,
} from "@/lib/business-status";
import { cn } from "@/lib/utils";

const STYLES: Record<BusinessStatus, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  EXPIRING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  EXPIRED: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  SUSPENDED: "bg-muted text-foreground",
  PASSIVE: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: BusinessStatus }) {
  return (
    <Badge className={cn("border-transparent", STYLES[status])}>
      {BUSINESS_STATUS_LABELS[status]}
    </Badge>
  );
}
