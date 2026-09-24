"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionResult, FormState } from "@/lib/action";
import { expireBusinessMenus } from "@/lib/cache";
import { db } from "@/lib/db";
import { parseDateInput } from "@/lib/format";
import { requireRole } from "@/lib/session";
import {
  extendSubscriptionSchema,
  startSubscriptionSchema,
} from "@/lib/validations/business";
import { firstError, id } from "@/lib/validations/common";

// Abonelik değişiklikleri menünün yayında olup olmadığını etkiler; her birinden sonra
// işletmenin menü önbelleği temizlenir.

export async function startSubscription(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("SUPER_ADMIN");
  const parsed = startSubscriptionSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { businessId, planId, startsAt, endsAt } = parsed.data;

  const [business, plan] = await Promise.all([
    db.business.findUnique({ where: { id: businessId, deletedAt: null } }),
    db.plan.findFirst({ where: { id: planId, isActive: true } }),
  ]);
  if (!business) return { ok: false, error: "İşletme bulunamadı." };
  if (!plan) return { ok: false, error: "Seçilen paket bulunamadı." };

  await db.subscription.create({
    data: {
      businessId,
      planId,
      startsAt: parseDateInput(startsAt, "start"),
      endsAt: parseDateInput(endsAt, "end"),
    },
  });
  await expireBusinessMenus(businessId);
  refresh();
  return { ok: true, data: null };
}

export async function extendSubscription(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("SUPER_ADMIN");
  const parsed = extendSubscriptionSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const subscription = await db.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
  });
  if (!subscription) return { ok: false, error: "Abonelik bulunamadı." };

  const endsAt = parseDateInput(parsed.data.endsAt, "end");
  if (endsAt <= subscription.endsAt) {
    return {
      ok: false,
      error: "Yeni bitiş tarihi mevcut bitiş tarihinden sonra olmalı.",
    };
  }

  await db.subscription.update({
    where: { id: subscription.id },
    // Yeni bitişe 7 gün kala hatırlatma yeniden gönderilir.
    data: { endsAt, reminderSentAt: null },
  });
  await expireBusinessMenus(subscription.businessId);
  refresh();
  return { ok: true, data: null };
}

const statusSchema = z.object({
  subscriptionId: id,
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});

export async function setSubscriptionStatus(
  input: unknown,
): Promise<ActionResult<null>> {
  await requireRole("SUPER_ADMIN");
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const subscription = await db.subscription.update({
    where: { id: parsed.data.subscriptionId },
    data: { status: parsed.data.status },
  });
  await expireBusinessMenus(subscription.businessId);
  refresh();
  return { ok: true, data: null };
}
