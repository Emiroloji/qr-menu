import type { Metadata } from "next";
import Link from "next/link";
import {
  BarList,
  ColumnChart,
  EmptyStats,
  formatCount,
  SegmentLinks,
  StatTile,
} from "@/components/panel/stats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BUSINESS_STATUS_LABELS,
  type BusinessStatus,
  getBusinessStatus,
  getCurrentSubscription,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { getLanguage, isLanguageCode } from "@/lib/languages";
import { requireRole } from "@/lib/session";
import {
  getLanguageShare,
  getScanSeries,
  getScanTotals,
  getTopBusinesses,
} from "@/lib/stats";
import {
  daysAgo,
  GRANULARITIES,
  isGranularity,
  percentChange,
} from "@/lib/stats-periods";

export const metadata: Metadata = { title: "İstatistikler" };

const STATUS_ORDER: BusinessStatus[] = [
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "SUSPENDED",
  "PASSIVE",
];

/** Süper admin için platform geneli istatistikler (FAZLAR 2.2). */
export default async function AdminStatsPage({
  searchParams,
}: PageProps<"/admin/stats">) {
  await requireRole("SUPER_ADMIN");
  const params = await searchParams;
  const granularity = isGranularity(params.period) ? params.period : "day";

  const now = new Date();
  const month = daysAgo(now, 30);
  const [
    businesses,
    branchCount,
    productCount,
    totals,
    series,
    topBusinesses,
    languages,
  ] = await Promise.all([
    db.business.findMany({
      where: { deletedAt: null },
      select: {
        isActive: true,
        subscriptions: {
          select: {
            status: true,
            startsAt: true,
            endsAt: true,
            plan: { select: { name: true } },
          },
        },
      },
    }),
    db.branch.count({
      where: { deletedAt: null, business: { deletedAt: null } },
    }),
    db.product.count({
      where: {
        deletedAt: null,
        category: {
          deletedAt: null,
          branch: { deletedAt: null, business: { deletedAt: null } },
        },
      },
    }),
    getScanTotals(null, now),
    getScanSeries(null, granularity, now),
    getTopBusinesses(month),
    getLanguageShare(null, month),
  ]);

  const statusCounts = new Map<BusinessStatus, number>();
  const planCounts = new Map<string, number>();
  for (const business of businesses) {
    const status = getBusinessStatus(business, now);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
    // Paket dağılımı: menüsü yayında olan işletmelerin geçerli paketi.
    const current = getCurrentSubscription(business.subscriptions, now);
    if (current && (status === "ACTIVE" || status === "EXPIRING")) {
      planCounts.set(
        current.plan.name,
        (planCounts.get(current.plan.name) ?? 0) + 1,
      );
    }
  }
  const live =
    (statusCounts.get("ACTIVE") ?? 0) + (statusCounts.get("EXPIRING") ?? 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">İstatistikler</h1>
        <p className="text-sm text-muted-foreground">
          Platform genelinde işletmeler, abonelikler ve menü taramaları.
        </p>
      </div>

      <section
        aria-label="Platform özeti"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatTile
          label="İşletme"
          value={businesses.length}
          note={`${live} tanesinin menüsü yayında`}
        />
        <StatTile
          label="Süresi yaklaşan"
          value={statusCounts.get("EXPIRING") ?? 0}
          note="7 gün içinde bitecek"
        />
        <StatTile label="Şube" value={branchCount} />
        <StatTile label="Ürün" value={productCount} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>İşletme durumları</CardTitle>
          </CardHeader>
          <CardContent>
            {businesses.length > 0 ? (
              <BarList
                rows={STATUS_ORDER.filter((s) => statusCounts.has(s)).map(
                  (s) => ({
                    key: s,
                    label: (
                      <Link
                        href={`/admin/businesses?status=${s}`}
                        className="hover:underline"
                      >
                        {BUSINESS_STATUS_LABELS[s]}
                      </Link>
                    ),
                    value: statusCounts.get(s)!,
                  }),
                )}
                unit="işletme"
              />
            ) : (
              <EmptyStats>Henüz işletme yok.</EmptyStats>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paket dağılımı</CardTitle>
            <CardDescription>
              Menüsü yayında olan işletmelerin paketi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planCounts.size > 0 ? (
              <BarList
                rows={[...planCounts]
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => ({
                    key: name,
                    label: name,
                    value: count,
                  }))}
                unit="işletme"
                showShare
              />
            ) : (
              <EmptyStats>Geçerli abonelik yok.</EmptyStats>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold tracking-tight">Menü taramaları</h2>
      <section aria-label="Tarama özeti" className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Bugün"
          value={totals.today}
          note={`Dün: ${formatCount(totals.yesterday)}`}
        />
        <StatTile
          label="Son 7 gün"
          value={totals.week}
          change={percentChange(totals.week, totals.prevWeek)}
          note="önceki 7 güne göre"
        />
        <StatTile
          label="Son 30 gün"
          value={totals.month}
          change={percentChange(totals.month, totals.prevMonth)}
          note="önceki 30 güne göre"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tarama sayısı</CardTitle>
            <CardDescription>
              {GRANULARITIES[granularity].description}; tüm işletmeler.
            </CardDescription>
          </div>
          <SegmentLinks
            label="Dönem"
            options={Object.entries(GRANULARITIES).map(([key, g]) => ({
              href: `/admin/stats?period=${key}`,
              label: g.label,
              active: key === granularity,
            }))}
          />
        </CardHeader>
        <CardContent>
          <ColumnChart
            data={series.map((b) => ({
              key: b.key,
              label: b.label,
              value: b.count,
            }))}
            caption={`${GRANULARITIES[granularity].label} tarama sayısı`}
            unit="tarama"
            labelEvery={granularity === "day" ? 7 : 3}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En çok taranan işletmeler</CardTitle>
            <CardDescription>Son 30 gün.</CardDescription>
          </CardHeader>
          <CardContent>
            {topBusinesses.length > 0 ? (
              <BarList
                rows={topBusinesses.map((b) => ({
                  key: b.id,
                  label: (
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="hover:underline"
                    >
                      {b.name}
                    </Link>
                  ),
                  value: b.count,
                }))}
                unit="tarama"
              />
            ) : (
              <EmptyStats>Son 30 günde tarama yok.</EmptyStats>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dil dağılımı</CardTitle>
            <CardDescription>Son 30 gün, tüm işletmeler.</CardDescription>
          </CardHeader>
          <CardContent>
            {languages.length > 0 ? (
              <BarList
                rows={languages.map((l) => ({
                  key: l.language,
                  label: isLanguageCode(l.language)
                    ? getLanguage(l.language).name
                    : l.language,
                  value: l.count,
                }))}
                unit="tarama"
                showShare
              />
            ) : (
              <EmptyStats>Son 30 günde tarama yok.</EmptyStats>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
