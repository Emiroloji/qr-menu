"use server";

import { refresh } from "next/cache";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireMenuLookup } from "@/lib/cache";
import { isPlatformDomain, normalizeDomain } from "@/lib/custom-domain";
import { db, isUniqueConstraintError } from "@/lib/db";
import { checkDomainDns } from "@/lib/domains";
import { assertOwner } from "@/lib/permissions";
import {
  assertFeature,
  canUseCustomDomain,
  readPlanFeatures,
} from "@/lib/plan-features";
import { requireWritableSession } from "@/lib/session";

// İşletmenin kendi alan adı (Faz 3.2). Yalnızca işletme sahibi, "Özel alan adı" içeren pakette.

async function requireDomainOwner() {
  const session = await requireWritableSession();
  await assertOwner(session.user);
  assertFeature(
    canUseCustomDomain(readPlanFeatures(session.subscription?.plan.features)),
  );
  return session;
}

/** Alan adını kaydeder; değiştiyse doğrulama sıfırlanır. */
export async function saveCustomDomain(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { businessId, business } = await requireDomainOwner();
    const domain = normalizeDomain(String(formData.get("domain") ?? ""));
    if (!domain)
      return {
        ok: false,
        error: "Geçerli bir alan adı girin (ör. menu.isletmeniz.com).",
      };
    if (isPlatformDomain(domain))
      return { ok: false, error: "Bu alan adı kullanılamaz." };
    if (domain === business.customDomain) return { ok: true, data: null };

    try {
      await db.business.update({
        where: { id: businessId },
        data: { customDomain: domain, customDomainVerifiedAt: null },
      });
    } catch (error) {
      if (isUniqueConstraintError(error))
        return {
          ok: false,
          error: "Bu alan adı başka bir işletmede kayıtlı.",
        };
      throw error;
    }
    expireMenuLookup();
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** DNS'in sunucumuzu gösterdiğini kontrol eder; doğruysa alan adı yayına girer. */
export async function verifyCustomDomain(): Promise<ActionResult<null>> {
  try {
    const { businessId, business } = await requireDomainOwner();
    if (!business.customDomain)
      return { ok: false, error: "Önce alan adınızı kaydedin." };

    const result = await checkDomainDns(business.customDomain);
    if (!result.ok) {
      return {
        ok: false,
        error: result.found.length
          ? `Alan adı başka bir sunucuyu gösteriyor (${result.found.join(", ")}). DNS değişikliğinin yayılması birkaç saat sürebilir.`
          : "Alan adı için DNS kaydı bulunamadı. Kaydı eklediyseniz yayılması birkaç saat sürebilir.",
      };
    }
    await db.business.update({
      where: { id: businessId },
      data: { customDomainVerifiedAt: new Date() },
    });
    expireMenuLookup();
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Alan adını kaldırır. Paket artık içermese de kaldırılabilir. */
export async function removeCustomDomain(): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await assertOwner(user);
    await db.business.update({
      where: { id: businessId },
      data: { customDomain: null, customDomainVerifiedAt: null },
    });
    expireMenuLookup();
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
