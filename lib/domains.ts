import "server-only";
import { resolve4 } from "node:dns/promises";
import { unstable_cache } from "next/cache";
import { getCurrentSubscription } from "@/lib/business-status";
import { MENU_LOOKUP_TAG } from "@/lib/cache";
import { platformHost } from "@/lib/custom-domain";
import { db } from "@/lib/db";
import { canUseCustomDomain, readPlanFeatures } from "@/lib/plan-features";

// İşletmenin kendi alan adı (Faz 3.2): DNS doğrulaması ve alan adından işletmeyi bulma.

type Resolver = (host: string) => Promise<string[]>;

const safeResolve = (resolver: Resolver) => async (host: string) => {
  try {
    return await resolver(host);
  } catch {
    return [];
  }
};

/** Sunucumuzun IP adresleri: platform adresi IP ise kendisi, değilse DNS kaydı. */
export async function platformAddresses(
  host = platformHost(),
  resolver: Resolver = resolve4,
) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return [host];
  return host ? safeResolve(resolver)(host) : [];
}

/**
 * Alan adı sunucumuzu gösteriyor mu? A kaydı (veya CNAME üzerinden çözülen adresler)
 * platformun adresleriyle kesişmelidir.
 */
export async function checkDomainDns(
  domain: string,
  resolver: Resolver = resolve4,
  expected?: string[],
) {
  const [found, platform] = await Promise.all([
    safeResolve(resolver)(domain),
    expected ?? platformAddresses(platformHost(), resolver),
  ]);
  return {
    ok: found.length > 0 && found.some((ip) => platform.includes(ip)),
    found,
    expected: platform,
  };
}

/**
 * Doğrulanmış alan adının işletmesi ve şubeleri. `allowed` false ise paket artık
 * alan adını içermiyor; ziyaretçi platformdaki menüye yönlendirilir (basılı QR'lar bozulmaz).
 */
export const getDomainSite = unstable_cache(
  async (host: string) => {
    const business = await db.business.findFirst({
      where: {
        customDomain: host,
        customDomainVerifiedAt: { not: null },
        deletedAt: null,
      },
      select: {
        slug: true,
        name: true,
        subscriptions: { include: { plan: { select: { features: true } } } },
        branches: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
          select: { slug: true, name: true },
        },
      },
    });
    if (!business) return null;
    const plan = getCurrentSubscription(business.subscriptions)?.plan;
    return {
      businessSlug: business.slug,
      businessName: business.name,
      branches: business.branches,
      allowed: canUseCustomDomain(readPlanFeatures(plan?.features)),
    };
  },
  ["domain-site"],
  { tags: [MENU_LOOKUP_TAG], revalidate: 300 },
);

/** Menü ve QR için kullanılacak alan adı: doğrulanmış ve paket izin veriyorsa. */
export function activeCustomDomain(
  business: {
    customDomain: string | null;
    customDomainVerifiedAt: Date | null;
  },
  features: unknown,
) {
  return business.customDomain &&
    business.customDomainVerifiedAt &&
    canUseCustomDomain(readPlanFeatures(features))
    ? business.customDomain
    : null;
}
