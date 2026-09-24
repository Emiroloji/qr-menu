"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBusinessMenus } from "@/lib/cache";
import { HEX_COLOR } from "@/lib/color";
import { db } from "@/lib/db";
import { isMenuTheme } from "@/lib/menu-themes";
import { assertOwner } from "@/lib/permissions";
import { canUseBranding, readPlanFeatures } from "@/lib/plan-features";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles } from "@/lib/storage";
import { firstError } from "@/lib/validations/common";

const appearanceSchema = z.object({
  theme: z.string().refine(isMenuTheme, "Geçersiz tema."),
  primaryColor: z
    .string()
    .regex(HEX_COLOR, "Geçerli bir renk seçin.")
    .optional(),
});

export async function saveAppearance(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { user, businessId, subscription } = await requireWritableSession();
    await assertOwner(user);
    const parsed = appearanceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    // Ana renk yalnızca "Logo ve renkler" içeren paketlerde kaydedilir.
    const branding = canUseBranding(
      readPlanFeatures(subscription?.plan.features),
    );
    await db.business.update({
      where: { id: businessId },
      data: {
        theme: parsed.data.theme,
        ...(branding &&
          parsed.data.primaryColor && {
            primaryColor: parsed.data.primaryColor.toUpperCase(),
          }),
      },
    });
    await expireBusinessMenus(businessId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeCover(): Promise<ActionResult<null>> {
  try {
    const { user, businessId, business } = await requireWritableSession();
    await assertOwner(user);
    if (!business.coverUrl) return { ok: true, data: null };

    await db.business.update({
      where: { id: businessId },
      data: { coverUrl: null },
    });
    await deleteFiles([business.coverUrl]);
    await expireBusinessMenus(businessId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
