import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3Icon, LockIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import {
  BarList,
  ColumnChart,
  EmptyStats,
  SegmentLinks,
  StatTile,
} from "@/components/panel/stats";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { getLanguage, isLanguageCode } from "@/lib/languages";
import { readPlanFeatures } from "@/lib/plan-features";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import {
  getLanguageShare,
  getPeakHours,
  getScanSeries,
  getScanTotals,
  getTopProducts,
} from "@/lib/stats";
import {
  daysAgo,
  GRANULARITIES,
  isGranularity,
  parseRange,
  percentChange,
  RANGES,
} from "@/lib/stats-periods";
import { StatsBranchSelect } from "./branch-select";

export const metadata: Metadata = { title: "İstatistikler" };

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

/**
 * Menü istatistikleri (FAZLAR 2.2). Paket "Temel" ise tarama sayıları, "Detaylı" ise
 * ayrıca yoğun saatler, dil dağılımı ve en çok açılan ürünler (proje-tanitimi, paketler).
 */
export default async function StatsPage({
  searchParams,
}: PageProps<"/panel/stats">) {
  const { businessId } = await requireOwnerSession();
  const [{ subscription }, branches, params] = await Promise.all([
    getBusinessContext(businessId),
    db.branch.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    searchParams,
  ]);
  const level = readPlanFeatures(subscription?.plan.features).stats;

  const header = (
    <PageHeader
      title="İstatistikler"
      description="Menünüzün kaç kez açıldığını ve müşterilerin en çok neye baktığını görün."
    />
  );

  if (level === "NONE") {
    return (
      <>
        {header}
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <LockIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">Paketiniz istatistik içermiyor.</p>
            <p className="text-sm text-muted-foreground">
              Menünüzün kaç kez açıldığını ve en çok ilgi gören ürünleri görmek
              için paketinizi yükseltin. Bunun için bizimle iletişime geçin.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (branches.length === 0) {
    return (
      <>
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <BarChart3Icon
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">
              İstatistikler için önce bir şube ekleyin.
            </p>
            <Link href="/panel/branches/new" className={buttonVariants()}>
              Şube ekle
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  // Şube yalnızca bu işletmenin şubeleri arasından seçilebilir (MIMARI §5).
  const branch = branches.find((b) => b.id === params.branch) ?? null;
  const scope = branch ? [branch.id] : branches.map((b) => b.id);
  const granularity = isGranularity(params.period) ? params.period : "day";
  const range = parseRange(params.range);
  const detailed = level === "DETAILED";

  const now = new Date();
  const since = daysAgo(now, range);
  const [totals, series, hours, languages, products] = await Promise.all([
    getScanTotals(scope, now),
    getScanSeries(scope, granularity, now),
    detailed ? getPeakHours(scope, since) : null,
    detailed ? getLanguageShare(scope, since) : null,
    detailed ? getTopProducts(scope, since) : null,
  ]);

  const href = (next: Record<string, string>) => {
    const query = new URLSearchParams({
      ...(branch && { branch: branch.id }),
      period: granularity,
      range: String(range),
      ...next,
    });
    return `/panel/stats?${query}`;
  };
  const busiest = hours?.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <>
      {header}

      {branches.length > 1 && (
        <StatsBranchSelect branches={branches} value={branch?.id ?? null} />
      )}

      <section aria-label="Tarama özeti" className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Bugün"
          value={totals.today}
          note={`Dün: ${totals.yesterday}`}
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
              {GRANULARITIES[granularity].description}; menünün QR ile veya
              bağlantıyla açılma sayısı.
            </CardDescription>
          </div>
          <SegmentLinks
            label="Dönem"
            options={Object.entries(GRANULARITIES).map(([key, g]) => ({
              href: href({ period: key }),
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

      {detailed && hours && languages && products ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Son {range} günün ayrıntıları
            </h2>
            <SegmentLinks
              label="Aralık"
              options={RANGES.map((r) => ({
                href: href({ range: String(r) }),
                label: `${r} gün`,
                active: r === range,
              }))}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Yoğun saatler</CardTitle>
              <CardDescription>
                {busiest && busiest.count > 0
                  ? `Menü en çok ${hourLabel(busiest.hour)}–${hourLabel((busiest.hour + 1) % 24)} arasında açılıyor.`
                  : "Günün saatlerine göre tarama sayısı."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {busiest && busiest.count > 0 ? (
                <ColumnChart
                  data={hours.map((h) => ({
                    key: String(h.hour),
                    label: hourLabel(h.hour),
                    value: h.count,
                  }))}
                  caption="Saatlere göre tarama sayısı"
                  unit="tarama"
                  labelEvery={3}
                  labelFrom="start"
                />
              ) : (
                <EmptyStats>Bu dönemde tarama yok.</EmptyStats>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dil dağılımı</CardTitle>
                <CardDescription>Menünün açıldığı dil.</CardDescription>
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
                  <EmptyStats>Bu dönemde tarama yok.</EmptyStats>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>En çok açılan ürünler</CardTitle>
                <CardDescription>
                  Müşterilerin menüde detayına baktığı ürünler.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {products.length > 0 ? (
                  <BarList
                    rows={products.map((p) => ({
                      key: p.id,
                      label: p.deleted ? `${p.name} (silindi)` : p.name,
                      sublabel:
                        branch || branches.length === 1
                          ? p.category
                          : `${p.branch} · ${p.category}`,
                      value: p.count,
                    }))}
                    unit="kez"
                  />
                ) : (
                  <EmptyStats>Bu dönemde açılan ürün yok.</EmptyStats>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-start gap-3 text-sm">
            <LockIcon
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="text-muted-foreground">
              Yoğun saatler, dil dağılımı ve en çok açılan ürünler Detaylı
              istatistik içeren pakette. Paket yükseltmek için bizimle iletişime
              geçin.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
