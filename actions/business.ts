"use server";

import { refresh } from "next/cache";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBusinessMenus } from "@/lib/cache";
import { db } from "@/lib/db";
import { assertOwner } from "@/lib/permissions";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles } from "@/lib/storage";
import { businessSettingsSchema } from "@/lib/validations/branch";
import { firstError } from "@/lib/validations/common";

export async function updateBusinessSettings(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = businessSettingsSchema.safeParse(
      Object.fromEntries(formData),
    );
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    await db.business.update({ where: { id: businessId }, data: parsed.data });
    await expireBusinessMenus(businessId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeLogo(): Promise<ActionResult<null>> {
  try {
    const { user, businessId, business } = await requireWritableSession();
    await assertOwner(user);
    if (!business.logoUrl) return { ok: true, data: null };

    await db.business.update({
      where: { id: businessId },
      data: { logoUrl: null },
    });
    await deleteFiles([business.logoUrl]);
    await expireBusinessMenus(businessId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
