"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionError } from "@/lib/action";
import { db } from "@/lib/db";
import { assertFeedbackBelongsToBusiness } from "@/lib/ownership";
import { requireWritableSession } from "@/lib/session";
import { firstError, id } from "@/lib/validations/common";

/** İşletme sahibi bir değerlendirmeyi kalıcı olarak siler (yalnızca kendi şubelerininkini). */
export async function deleteFeedback(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const session = await requireWritableSession();
    if (session.user.role !== "OWNER")
      return { ok: false, error: "Bu işlem için yetkiniz yok." };
    const parsed = z.object({ feedbackId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const feedback = await assertFeedbackBelongsToBusiness(
      parsed.data.feedbackId,
      session.businessId,
    );
    await db.feedback.delete({ where: { id: feedback.id } });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
