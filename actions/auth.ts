"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import type { FormState } from "@/lib/action";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { homePathFor } from "@/lib/permissions";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "@/lib/validations/auth";

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  // Giriş hız sınırı: aynı IP'den ve aynı hesaba (şifre tahminine karşı).
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  const email = parsed.data.email.toLowerCase();
  if (
    !consumeRateLimit(`signin:ip:${ip}`, RATE_LIMITS.signInIp) ||
    !consumeRateLimit(`signin:email:${email}`, RATE_LIMITS.signInEmail)
  ) {
    return {
      ok: false,
      error:
        "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
    };
  }

  let homePath: string;
  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: requestHeaders,
    });
    const user = await db.user.findUniqueOrThrow({
      where: { id: result.user.id },
      select: { role: true },
    });
    homePath = homePathFor(user.role);
  } catch (error) {
    if (error instanceof APIError) {
      return error.status === "TOO_MANY_REQUESTS"
        ? {
            ok: false,
            error: "Çok fazla deneme yaptınız. Lütfen biraz bekleyin.",
          }
        : { ok: false, error: "E-posta veya şifre hatalı." };
    }
    throw error;
  }
  redirect(homePath);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  if (
    !consumeRateLimit(`reset:ip:${ip}`, RATE_LIMITS.resetIp) ||
    !consumeRateLimit(
      `reset:email:${parsed.data.email.toLowerCase()}`,
      RATE_LIMITS.resetEmail,
    )
  ) {
    return {
      ok: false,
      error: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.",
    };
  }

  // E-posta kayıtlı olsun olmasın aynı yanıt döner.
  await auth.api.requestPasswordReset({
    body: { email: parsed.data.email, redirectTo: "/reset-password" },
    headers: requestHeaders,
  });
  return { ok: true, data: null };
}

export async function resetPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return {
        ok: false,
        error:
          "Bağlantının süresi dolmuş veya geçersiz. Yeni bir sıfırlama isteği gönderin.",
      };
    }
    throw error;
  }
  return { ok: true, data: null };
}
