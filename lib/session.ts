import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
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
 * "İşletmenin gözünden bak" (FAZLAR 2.5): süper admin bu çerezle bir işletmenin panelini
 * sahibi gibi, salt okunur görür. Çerez yalnızca SUPER_ADMIN rolündeki oturumda dikkate
 * alınır; süper admin zaten tüm işletmeleri görebildiği için imza gerekmez.
 */
export const VIEW_AS_COOKIE = "qrmenu-view-as";

/**
 * Panel kimliği: işletme sahibi, çalışan veya görüntüleme modundaki süper admin.
 * `businessId` her zaman sunucudan gelir (oturum veya süper adminin seçimi).
 */
export const getPanelIdentity = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "SUPER_ADMIN") {
    const businessId = (await cookies()).get(VIEW_AS_COOKIE)?.value;
    if (!businessId) return null;
    const business = await db.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true },
    });
    if (!business) return null;
    return {
      user: { ...user, role: "OWNER" as Role, businessId, permissions: [] },
      businessId,
      viewOnly: true,
    };
  }
  if (!user.businessId) return null;
  return { user, businessId: user.businessId, viewOnly: false };
});

/**
 * Panel için: işletme sahibi veya çalışan. `businessId` her zaman oturumdan gelir,
 * istemciden gelen bir değere asla güvenilmez.
 */
export async function requireSession() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const identity = await getPanelIdentity();
  if (!identity)
    redirect(user.role === "SUPER_ADMIN" ? homePathFor(user.role) : "/login");
  return identity;
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
  if (session.viewOnly) {
    throw new ActionError("İşletmenin gözünden bakarken değişiklik yapılamaz.");
  }
  const context = await getBusinessContext(session.businessId);
  if (!isBusinessOperational(context.status)) {
    throw new ActionError(READ_ONLY_MESSAGES[context.status]);
  }
  return { ...session, ...context };
}
