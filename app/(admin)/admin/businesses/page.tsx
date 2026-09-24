import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getCurrentSubscription,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../_components/status-badge";

export const metadata: Metadata = { title: "İşletmeler" };

const FILTERS: ("ALL" | BusinessStatus)[] = [
  "ALL",
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "SUSPENDED",
  "PASSIVE",
];

export default async function BusinessesPage({
  searchParams,
}: PageProps<"/admin/businesses">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const filter = FILTERS.find((f) => f === params.status) ?? "ALL";

  const contains = { contains: q, mode: "insensitive" as const };
  const businesses = await db.business.findMany({
    where: {
      deletedAt: null,
      ...(q && {
        OR: [
          { name: contains },
          { slug: contains },
          {
            users: {
              some: {
                role: "OWNER",
                OR: [{ email: contains }, { name: contains }],
              },
            },
          },
        ],
      }),
    },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { endsAt: "desc" } },
      users: { where: { role: "OWNER" }, take: 1 },
      _count: { select: { branches: { where: { deletedAt: null } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = businesses.map((business) => {
    const subscription =
      getCurrentSubscription(business.subscriptions) ??
      business.subscriptions[0];
    return { business, subscription, status: getBusinessStatus(business) };
  });
  const counts = Object.fromEntries(
    FILTERS.map((f) => [
      f,
      f === "ALL" ? rows.length : rows.filter((r) => r.status === f).length,
    ]),
  );
  const visible =
    filter === "ALL" ? rows : rows.filter((r) => r.status === filter);

  const filterHref = (f: string) => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (f !== "ALL") search.set("status", f);
    const query = search.toString();
    return `/admin/businesses${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="İşletmeler"
        description="Yeni işletme açın, paket atayın ve abonelikleri takip edin."
        actions={
          <Link href="/admin/businesses/new" className={buttonVariants()}>
            <PlusIcon />
            Yeni işletme
          </Link>
        }
      />

      <section className="flex flex-col rounded-xl border bg-background">
        <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center">
          <form role="search" className="relative lg:w-72">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="İşletme, adres veya sahip ara"
              aria-label="İşletme ara"
              className="pl-8"
            />
            {filter !== "ALL" && (
              <input type="hidden" name="status" value={filter} />
            )}
          </form>
          <nav
            aria-label="Durum filtresi"
            className="flex gap-1 overflow-x-auto"
          >
            {FILTERS.map((f) => (
              <Link
                key={f}
                href={filterHref(f)}
                aria-current={f === filter ? "page" : undefined}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted",
                  f === filter && "bg-muted font-medium text-foreground",
                )}
              >
                {f === "ALL" ? "Tümü" : BUSINESS_STATUS_LABELS[f]}
                <span className="text-xs tabular-nums">{counts[f]}</span>
              </Link>
            ))}
          </nav>
        </div>

        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            {q || filter !== "ALL"
              ? "Bu aramaya uyan işletme yok."
              : "Henüz işletme yok."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İşletme</TableHead>
                <TableHead>Sahip</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(({ business, subscription, status }) => {
                const owner = business.users[0];
                const maxBranches = subscription?.plan.maxBranches;
                return (
                  <TableRow key={business.id}>
                    <TableCell>
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="flex flex-col font-medium hover:underline"
                      >
                        {business.name}
                        <span className="font-mono text-xs font-normal text-muted-foreground">
                          /{business.slug}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {owner ? (
                        <div className="flex flex-col">
                          {owner.name}
                          <span className="text-xs text-muted-foreground">
                            {owner.email}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{subscription?.plan.name ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {business._count.branches} / {maxBranches ?? "∞"}
                    </TableCell>
                    <TableCell>
                      {subscription ? formatDate(subscription.endsAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </>
  );
}
