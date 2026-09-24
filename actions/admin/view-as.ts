"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole, VIEW_AS_COOKIE } from "@/lib/session";
import { id } from "@/lib/validations/common";

// "İşletmenin gözünden bak" (FAZLAR 2.5): süper admin işletme panelini salt okunur görür.

const TWO_HOURS = 2 * 60 * 60;

export async function startViewingBusiness(businessId: string) {
  await requireRole("SUPER_ADMIN");
  const business = await db.business.findFirst({
    where: { id: id.parse(businessId), deletedAt: null },
    select: { id: true },
  });
  if (!business) redirect("/admin/businesses");

  (await cookies()).set(VIEW_AS_COOKIE, business.id, {
    httpOnly: true,
    sameSite: "lax",
    // Alan adı gelene kadar site HTTP ile de çalışır (docs/YAYIN.md §2a).
    secure: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    path: "/",
    maxAge: TWO_HOURS,
  });
  redirect("/panel");
}

export async function stopViewingBusiness() {
  await requireRole("SUPER_ADMIN");
  const store = await cookies();
  const businessId = store.get(VIEW_AS_COOKIE)?.value;
  store.delete(VIEW_AS_COOKIE);
  redirect(businessId ? `/admin/businesses/${businessId}` : "/admin");
}
