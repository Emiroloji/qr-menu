"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { z } from "zod";
import type { ActionResult, FormState } from "@/lib/action";
import { auth } from "@/lib/auth";
import { db, isUniqueConstraintError } from "@/lib/db";
import { parseDateInput } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { createBusinessSchema } from "@/lib/validations/business";
import { firstError, id } from "@/lib/validations/common";

/** Sahibe "şifreni belirle" (yeni hesap) veya "şifre sıfırlama" bağlantısı gönderir. */
async function sendLoginLink(email: string) {
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/reset-password" },
  });
}

export async function createBusiness(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  await requireRole("SUPER_ADMIN");

  const parsed = createBusinessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { name, slug, ownerName, ownerEmail, planId, startsAt, endsAt } =
    parsed.data;

  const [plan, slugTaken, emailTaken] = await Promise.all([
    db.plan.findFirst({ where: { id: planId, isActive: true } }),
    db.business.findUnique({ where: { slug } }),
    db.user.findUnique({ where: { email: ownerEmail } }),
  ]);
  if (!plan) return { ok: false, error: "Seçilen paket bulunamadı." };
  if (slugTaken)
    return {
      ok: false,
      error: "Bu menü adresi başka bir işletmede kullanılıyor.",
    };
  if (emailTaken)
    return { ok: false, error: "Bu e-posta adresiyle bir hesap zaten var." };

  let businessId: string;
  try {
    businessId = await db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name,
          slug,
          subscriptions: {
            create: {
              planId,
              startsAt: parseDateInput(startsAt, "start"),
              endsAt: parseDateInput(endsAt, "end"),
            },
          },
        },
      });
      await tx.user.create({
        data: {
          id: randomUUID(),
          name: ownerName,
          email: ownerEmail,
          role: "OWNER",
          businessId: business.id,
        },
      });
      return business.id;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        error: "Bu menü adresi veya e-posta zaten kullanılıyor.",
      };
    }
    throw error;
  }

  await sendLoginLink(ownerEmail);
  refresh();
  return { ok: true, data: { id: businessId } };
}

const setActiveSchema = z.object({ businessId: id, isActive: z.boolean() });

export async function setBusinessActive(
  input: unknown,
): Promise<ActionResult<null>> {
  await requireRole("SUPER_ADMIN");
  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  // Menü önbelleği (Faz 1.10) geldiğinde burada şubelerin etiketleri de temizlenecek.
  await db.business.update({
    where: { id: parsed.data.businessId, deletedAt: null },
    data: { isActive: parsed.data.isActive },
  });
  refresh();
  return { ok: true, data: null };
}

export async function sendOwnerLoginLink(
  input: unknown,
): Promise<ActionResult<null>> {
  await requireRole("SUPER_ADMIN");
  const parsed = z.object({ businessId: id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const owner = await db.user.findFirst({
    where: { businessId: parsed.data.businessId, role: "OWNER" },
  });
  if (!owner) return { ok: false, error: "Bu işletmenin sahibi bulunamadı." };

  await sendLoginLink(owner.email);
  return { ok: true, data: null };
}
