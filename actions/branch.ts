"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu, expireMenuLookup } from "@/lib/cache";
import { db, isUniqueConstraintError } from "@/lib/db";
import { assertBranchBelongsToBusiness } from "@/lib/ownership";
import { assertOwner } from "@/lib/permissions";
import { assertPlanLimit } from "@/lib/plan-limits";
import { requireWritableSession } from "@/lib/session";
import { branchSchema } from "@/lib/validations/branch";
import { firstError, id } from "@/lib/validations/common";

const SLUG_TAKEN = "Bu adres bu işletmenin başka bir şubesinde kullanılıyor.";

export async function saveBranch(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  try {
    // 1–2. Oturum, salt okunur kontrolü, yetki
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);

    // 3. Girdi
    const branchId = id.optional().parse(formData.get("id") || undefined);
    const parsed = branchSchema.safeParse({
      ...Object.fromEntries(formData),
      languages: formData.getAll("languages"),
    });
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    // 4–5. Sahiplik ve paket limitleri
    if (branchId) await assertBranchBelongsToBusiness(branchId, businessId);
    else await assertPlanLimit(businessId, "branches");
    await assertPlanLimit(businessId, "languages", {
      languageCount: parsed.data.languages.length,
    });

    // 6. İşlem
    const branch = branchId
      ? await db.branch.update({ where: { id: branchId }, data: parsed.data })
      : await db.branch.create({ data: { ...parsed.data, businessId } });

    // 7. Önbellek
    expireBranchMenu(branch.id);
    expireMenuLookup();
    refresh();
    return { ok: true, data: { id: branch.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { ok: false, error: SLUG_TAKEN };
    return toActionError(error);
  }
}

/** Yumuşak silme; adres serbest kalsın diye slug'a ek yapılır. */
export async function deleteBranch(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = z.object({ branchId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    await assertBranchBelongsToBusiness(parsed.data.branchId, businessId);

    const branch = await db.branch.findUniqueOrThrow({
      where: { id: parsed.data.branchId },
    });
    await db.branch.update({
      where: { id: branch.id },
      data: {
        deletedAt: new Date(),
        slug: `${branch.slug}-silindi-${Date.now().toString(36)}`,
      },
    });
    expireBranchMenu(branch.id);
    expireMenuLookup();
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
