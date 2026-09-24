"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { auth } from "@/lib/auth";
import { db, isUniqueConstraintError } from "@/lib/db";
import type { Permission } from "@/lib/generated/prisma/enums";
import { assertStaffBelongsToBusiness } from "@/lib/ownership";
import { assertOwner } from "@/lib/permissions";
import { assertPlanLimit } from "@/lib/plan-limits";
import { requireWritableSession } from "@/lib/session";
import { firstError, id } from "@/lib/validations/common";
import { newStaffSchema, staffSchema } from "@/lib/validations/staff";

const EMAIL_TAKEN = "Bu e-posta adresiyle bir hesap zaten var.";

/** "Şifreni belirle" bağlantısı (yeni hesap) veya şifre sıfırlama bağlantısı. */
async function sendLoginLink(email: string) {
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reset-password" },
  });
}

function readForm(formData: FormData) {
  return {
    ...Object.fromEntries(formData),
    permissions: formData.getAll("permissions"),
  };
}

export async function createStaff(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = newStaffSchema.safeParse(readForm(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    await assertPlanLimit(businessId, "staff");

    const { name, email, permissions } = parsed.data;
    if (await db.user.findUnique({ where: { email } }))
      return { ok: false, error: EMAIL_TAKEN };

    const staff = await db.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        role: "STAFF",
        businessId,
        permissions: {
          create: permissions.map((permission) => ({
            permission: permission as Permission,
          })),
        },
      },
    });
    await sendLoginLink(email);
    refresh();
    return { ok: true, data: { id: staff.id } };
  } catch (error) {
    if (isUniqueConstraintError(error))
      return { ok: false, error: EMAIL_TAKEN };
    return toActionError(error);
  }
}

export async function updateStaff(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const staffId = id.parse(formData.get("id"));
    const parsed = staffSchema.safeParse(readForm(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    await assertStaffBelongsToBusiness(staffId, businessId);

    // Yetkiler her istekte veritabanından okunur; değişiklik hemen geçerli olur.
    await db.$transaction([
      db.staffPermission.deleteMany({ where: { userId: staffId } }),
      db.user.update({
        where: { id: staffId },
        data: {
          name: parsed.data.name,
          permissions: {
            create: parsed.data.permissions.map((permission) => ({
              permission: permission as Permission,
            })),
          },
        },
      }),
    ]);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Hesap tamamen silinir; açık oturumları da kapanır. */
export async function deleteStaff(input: unknown): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = z.object({ staffId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    await assertStaffBelongsToBusiness(parsed.data.staffId, businessId);

    await db.user.delete({ where: { id: parsed.data.staffId } });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function sendStaffLoginLink(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    const parsed = z.object({ staffId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const staff = await assertStaffBelongsToBusiness(
      parsed.data.staffId,
      businessId,
    );

    await sendLoginLink(staff.email);
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
