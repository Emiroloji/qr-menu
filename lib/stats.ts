import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/db";
import {
  type Granularity,
  buckets,
  daysAgo,
  startOfDay,
} from "@/lib/stats-periods";

// İstatistik sorguları (Faz 2.2). `branchIds` panelde her zaman oturumdaki işletmenin
// şubeleridir (MIMARI §5); `null` yalnızca süper admin için tüm platform demektir.
type Scope = string[] | null;

// Kayıtlar UTC tutulur; gün, hafta, ay ve saat Türkiye saatiyle gruplanır.
const LOCAL_TIME = Prisma.sql`("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Istanbul')`;
const DAY_MS = 24 * 60 * 60 * 1000;

const scanWhere = (scope: Scope, from: Date, to?: Date) => ({
  ...(scope && { branchId: { in: scope } }),
  createdAt: { gte: from, ...(to && { lt: to }) },
});

const branchFilter = (scope: Scope) =>
  scope ? Prisma.sql`AND "branchId" = ANY(${scope})` : Prisma.empty;

/** Bugün, dün, son 7 ve 30 gün ile bir önceki 7 ve 30 günlük dönem. */
export async function getScanTotals(scope: Scope, now: Date) {
  const today = startOfDay(now);
  const week = daysAgo(now, 7);
  const month = daysAgo(now, 30);
  const count = (from: Date, to?: Date) =>
    db.scanLog.count({ where: scanWhere(scope, from, to) });
  const [todayCount, yesterday, lastWeek, prevWeek, lastMonth, prevMonth] =
    await Promise.all([
      count(today),
      count(new Date(today.getTime() - DAY_MS), today),
      count(week),
      count(new Date(week.getTime() - 7 * DAY_MS), week),
      count(month),
      count(new Date(month.getTime() - 30 * DAY_MS), month),
    ]);
  return {
    today: todayCount,
    yesterday,
    week: lastWeek,
    prevWeek,
    month: lastMonth,
    prevMonth,
  };
}

/** Günlük, haftalık veya aylık tarama sayıları; boş dönemler 0 olarak doldurulur. */
export async function getScanSeries(
  scope: Scope,
  granularity: Granularity,
  now: Date,
) {
  const list = buckets(granularity, now);
  const rows = await db.$queryRaw<{ key: string; count: number }[]>`
    SELECT to_char(date_trunc(${granularity}, ${LOCAL_TIME}), 'YYYY-MM-DD') AS key,
           count(*)::int AS count
    FROM "ScanLog"
    WHERE "createdAt" >= ${list[0].start} ${branchFilter(scope)}
    GROUP BY 1`;
  const counts = new Map(rows.map((r) => [r.key, r.count]));
  return list.map((b) => ({ ...b, count: counts.get(b.key) ?? 0 }));
}

/** Günün saatlerine göre tarama sayısı (0–23, Türkiye saati). */
export async function getPeakHours(scope: Scope, since: Date) {
  const rows = await db.$queryRaw<{ hour: number; count: number }[]>`
    SELECT extract(hour FROM ${LOCAL_TIME})::int AS hour, count(*)::int AS count
    FROM "ScanLog"
    WHERE "createdAt" >= ${since} ${branchFilter(scope)}
    GROUP BY 1`;
  const counts = new Map(rows.map((r) => [r.hour, r.count]));
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: counts.get(hour) ?? 0,
  }));
}

/** Menünün açıldığı dillere göre tarama sayısı, çoktan aza. */
export async function getLanguageShare(scope: Scope, since: Date) {
  const rows = await db.scanLog.groupBy({
    by: ["language"],
    where: scanWhere(scope, since),
    _count: { _all: true },
  });
  return rows
    .map((r) => ({ language: r.language, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}

/** Menüde detayı en çok açılan ürünler. */
export async function getTopProducts(scope: string[], since: Date, take = 10) {
  const rows = await db.productView.groupBy({
    by: ["productId"],
    where: { branchId: { in: scope }, createdAt: { gte: since } },
    _count: { _all: true },
    orderBy: { _count: { productId: "desc" } },
    take,
  });
  const products = await db.product.findMany({
    where: { id: { in: rows.map((r) => r.productId) } },
    select: {
      id: true,
      name: true,
      deletedAt: true,
      category: { select: { name: true, branch: { select: { name: true } } } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return rows.flatMap((r) => {
    const product = byId.get(r.productId);
    if (!product) return [];
    return [
      {
        id: product.id,
        name: product.name,
        category: product.category.name,
        branch: product.category.branch.name,
        deleted: product.deletedAt !== null,
        count: r._count._all,
      },
    ];
  });
}

/** Süper admin: platform genelinde en çok taranan işletmeler. */
export async function getTopBusinesses(since: Date, take = 10) {
  return db.$queryRaw<
    { id: string; name: string; slug: string; count: number }[]
  >`
    SELECT b.id, b.name, b.slug, count(*)::int AS count
    FROM "ScanLog" s
    JOIN "Branch" br ON br.id = s."branchId"
    JOIN "Business" b ON b.id = br."businessId"
    WHERE s."createdAt" >= ${since}
    GROUP BY b.id
    ORDER BY count DESC
    LIMIT ${take}`;
}
