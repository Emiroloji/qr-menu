import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
