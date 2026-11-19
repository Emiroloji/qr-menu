import "server-only";
import { db } from "@/lib/db";

// İşletme panelindeki "Değerlendirmeler" sayfasının sorguları.

export const FEEDBACK_PAGE_SIZE = 50;

export type Rating = 1 | 2 | 3 | 4 | 5;

export async function getFeedbackSummary(branchIds: string[]) {
  const rows = await db.feedback.groupBy({
    by: ["rating"],
    where: { branchId: { in: branchIds } },
    _count: { _all: true },
  });
  const counts: Record<Rating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let sum = 0;
  for (const row of rows) {
    const rating = row.rating as Rating;
    counts[rating] = row._count._all;
    total += row._count._all;
    sum += rating * row._count._all;
  }
  return { total, average: total ? sum / total : null, counts };
}

export async function listFeedback(branchIds: string[], page: number) {
  const rows = await db.feedback.findMany({
    where: { branchId: { in: branchIds } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * FEEDBACK_PAGE_SIZE,
    take: FEEDBACK_PAGE_SIZE + 1,
    select: {
      id: true,
      rating: true,
      message: true,
      language: true,
      createdAt: true,
      readAt: true,
      branch: { select: { name: true } },
    },
  });
  return {
    items: rows.slice(0, FEEDBACK_PAGE_SIZE),
    hasMore: rows.length > FEEDBACK_PAGE_SIZE,
  };
}

/** Panel menüsündeki rozet: işletmenin okunmamış değerlendirmeleri. */
export function countUnreadFeedback(businessId: string) {
  return db.feedback.count({
    where: { readAt: null, branch: { businessId, deletedAt: null } },
  });
}

/** Görüntülenen değerlendirmeleri okundu işaretler. */
export function markFeedbackRead(ids: string[]) {
  return db.feedback.updateMany({
    where: { id: { in: ids }, readAt: null },
    data: { readAt: new Date() },
  });
}
