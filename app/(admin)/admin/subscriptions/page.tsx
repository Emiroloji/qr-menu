import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/panel/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BUSINESS_STATUS_LABELS,
  type BusinessStatus,
  getBusinessStatus,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../_components/status-badge";

export const metadata: Metadata = { title: "Abonelikler" };

const FILTERS: BusinessStatus[] = [
  "EXPIRING",
  "EXPIRED",
  "SUSPENDED",
  "ACTIVE",
];

/** Her işletmenin en son biten aboneliği; bitiş tarihine göre sıralı. */
export default async function SubscriptionsPage({
  searchParams,
}: PageProps<"/admin/subscriptions">) {
  const params = await searchParams;
  const filter = FILTERS.find((f) => f === params.status) ?? "EXPIRING";

  const businesses = await db.business.findMany({
    where: { deletedAt: null, isActive: true },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { endsAt: "desc" } },
    },
  });

  const rows = businesses
    .map((business) => ({
      business,
      subscription: business.subscriptions[0],
      status: getBusinessStatus(business),
    }))
    .filter((r) => r.subscription);
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, rows.filter((r) => r.status === f).length]),
  );
  const visible = rows
    .filter((r) => r.status === filter)
    .sort(
      (a, b) =>
        a.subscription.endsAt.getTime() - b.subscription.endsAt.getTime(),
    );

  return (
    <>
      <PageHeader
        title="Abonelikler"
        description="Uzatma ve askıya alma işlemleri işletme sayfasından yapılır. Pasif işletmeler burada listelenmez."
      />
      <section className="flex flex-col rounded-xl border bg-background">
        <nav
          aria-label="Durum filtresi"
          className="flex gap-1 overflow-x-auto border-b p-3"
        >
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/admin/subscriptions?status=${f}`}
              aria-current={f === filter ? "page" : undefined}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted",
                f === filter && "bg-muted font-medium text-foreground",
              )}
            >
              {BUSINESS_STATUS_LABELS[f]}
              <span className="text-xs tabular-nums">{counts[f]}</span>
            </Link>
          ))}
        </nav>
        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Bu durumda abonelik yok.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İşletme</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ business, subscription, status }) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="font-medium hover:underline"
                    >
                      {business.name}
                    </Link>
                  </TableCell>
                  <TableCell>{subscription.plan.name}</TableCell>
                  <TableCell>{formatDate(subscription.startsAt)}</TableCell>
                  <TableCell>{formatDate(subscription.endsAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}
