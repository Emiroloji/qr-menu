"use server";

import { refresh } from "next/cache";
import type { FormState } from "@/lib/action";
import { db, isUniqueConstraintError } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { firstError, id } from "@/lib/validations/common";
import { planSchema } from "@/lib/validations/plan";

export async function savePlan(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  await requireRole("SUPER_ADMIN");

  const planId = id.optional().parse(formData.get("id") || undefined);
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  try {
    const plan = planId
      ? await db.plan.update({ where: { id: planId }, data: parsed.data })
      : await db.plan.create({ data: parsed.data });
    refresh();
    return { ok: true, data: { id: plan.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: "Bu adla bir paket zaten var." };
    }
    throw error;
  }
}
