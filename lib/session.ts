import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ActionError } from "@/lib/action";
import {
  getBusinessStatus,
  getCurrentSubscription,
  isBusinessOperational,
  READ_ONLY_MESSAGES,
} from "@/lib/business-status";
import type { Role } from "@/lib/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { homePathFor } from "@/lib/permissions";

/** Oturumdaki kullanıcı (yetkileriyle). İstek başına bir kez sorgulanır. */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.user.id },
    include: { permissions: true },
  });
});

/** Oturum yoksa girişe, rol uymuyorsa kullanıcının kendi alanına yönlendirir. */
export async function requireRole(...roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homePathFor(user.role));
  return user;
}

/**
 * Panel için: işletme sahibi veya çalışan. `businessId` her zaman oturumdan gelir,
 * istemciden gelen bir değere asla güvenilmez.
 */
export async function requireSession() {
  const user = await requireRole("OWNER", "STAFF");
  if (!user.businessId) redirect("/login");
  return { user, businessId: user.businessId };
}

/** Yalnızca işletme sahibine açık panel sayfaları için; çalışan özete yönlendirilir. */
export async function requireOwnerSession() {
  const session = await requireSession();
  if (session.user.role !== "OWNER") redirect("/panel");
  return session;
}

/** İşletme, durumu ve geçerli aboneliği (paketiyle). İstek başına bir kez sorgulanır. */
export const getBusinessContext = cache(async (businessId: string) => {
  const business = await db.business.findUnique({
    where: { id: businessId, deletedAt: null },
    include: { subscriptions: { include: { plan: true } } },
  });
  if (!business) throw new Error("İşletme bulunamadı.");
  return {
    business,
    status: getBusinessStatus(business),
    subscription: getCurrentSubscription(business.subscriptions),
  };
});

/**
 * Panelde veri değiştiren her işlem için. İşletme pasifse, aboneliği bitmiş veya
 * askıdaysa panel salt okunurdur (MIMARI §7).
 */
export async function requireWritableSession() {
  const session = await requireSession();
  const context = await getBusinessContext(session.businessId);
  if (!isBusinessOperational(context.status)) {
    throw new ActionError(READ_ONLY_MESSAGES[context.status]);
  }
  return { ...session, ...context };
}
