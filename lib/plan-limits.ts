import "server-only";
import { ActionError } from "@/lib/action";
import { db } from "@/lib/db";

export type PlanResource = "branches" | "products" | "staff" | "languages";

const MESSAGES: Record<PlanResource, string> = {
  branches: "Paketinizin şube limitine ulaştınız.",
  products: "Paketinizin ürün limitine ulaştınız.",
  staff: "Paketinizin çalışan limitine ulaştınız.",
  languages: "Paketiniz bu kadar dil seçeneğine izin vermiyor.",
};

/** Limit null ise sınırsızdır. */
export function isWithinLimit(limit: number | null, next: number) {
  return limit === null || next <= limit;
}

/** İşletmenin şu an geçerli aboneliğinin paketi. */
export async function getActivePlan(businessId: string) {
  const now = new Date();
  const subscription = await db.subscription.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    orderBy: { endsAt: "desc" },
    include: { plan: true },
  });
  return subscription?.plan ?? null;
}

/** İşletmenin paket limitine sayılan kullanımı (silinmiş kayıtlar hariç). */
export async function countUsage(
  businessId: string,
  resource: Exclude<PlanResource, "languages">,
) {
  const branch = { businessId, deletedAt: null };
  switch (resource) {
    case "branches":
      return db.branch.count({ where: branch });
    case "products":
      return db.product.count({
        where: { deletedAt: null, category: { deletedAt: null, branch } },
      });
    case "staff":
      return db.user.count({ where: { businessId, role: "STAFF" } });
  }
}

/**
 * Yeni kayıt eklemeden önce paket limitini kontrol eder.
 * Diller şube başınadır: `languages` için şubenin seçeceği toplam dil sayısı verilir.
 */
export async function assertPlanLimit(
  businessId: string,
  resource: PlanResource,
  options: { languageCount?: number } = {},
) {
  const plan = await getActivePlan(businessId);
  if (!plan) throw new ActionError("Aktif bir aboneliğiniz yok.");

  const limits = {
    branches: plan.maxBranches,
    products: plan.maxProducts,
    staff: plan.maxStaff,
    languages: plan.maxLanguages,
  };
  const next =
    resource === "languages"
      ? (options.languageCount ?? 1)
      : (await countUsage(businessId, resource)) + 1;

  if (!isWithinLimit(limits[resource], next)) {
    throw new ActionError(MESSAGES[resource]);
  }
}
