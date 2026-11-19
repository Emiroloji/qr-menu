"use server";

import { headers } from "next/headers";
import {
  getBusinessStatus,
  getCurrentSubscription,
  isBusinessOperational,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { canUseFeedback, readPlanFeatures } from "@/lib/plan-features";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isBot } from "@/lib/scan-log";
import { feedbackSchema } from "@/lib/validations/feedback";

export type FeedbackResult =
  { ok: true } | { ok: false; error: "invalid" | "limited" | "unavailable" };

/**
 * Müşterinin menüden bıraktığı değerlendirme. Oturum gerektirmez; IP yalnızca hız
 * sınırı için bellekte kullanılır, saklanmaz (KURALLAR 7). Şube yayında olmalı ve
 * paketi değerlendirmeyi içermeli; önbellek değil veritabanı sorgulanır.
 * Hata kodu döner; menü metni kendi dilinde gösterir.
 */
export async function submitFeedback(input: unknown): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const requestHeaders = await headers();
  if (isBot(requestHeaders.get("user-agent") ?? ""))
    return { ok: false, error: "invalid" };
  const { branchId, rating, message, lang } = parsed.data;
  if (
    !consumeRateLimit(
      `feedback:${clientIp(requestHeaders)}:${branchId}`,
      RATE_LIMITS.feedback,
    )
  )
    return { ok: false, error: "limited" };

  const branch = await db.branch.findFirst({
    where: { id: branchId, deletedAt: null, business: { deletedAt: null } },
    select: {
      business: {
        select: {
          isActive: true,
          subscriptions: { include: { plan: { select: { features: true } } } },
        },
      },
    },
  });
  if (!branch) return { ok: false, error: "unavailable" };
  const { business } = branch;
  const plan = getCurrentSubscription(business.subscriptions)?.plan;
  if (
    !isBusinessOperational(getBusinessStatus(business)) ||
    !canUseFeedback(readPlanFeatures(plan?.features))
  )
    return { ok: false, error: "unavailable" };

  await db.feedback.create({
    data: { branchId, rating, message, language: lang },
  });
  return { ok: true };
}
