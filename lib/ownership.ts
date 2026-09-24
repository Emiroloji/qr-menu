import "server-only";
import { ActionError } from "@/lib/action";
import { db } from "@/lib/db";

// Kaydın oturumdaki işletmeye ait olduğunu doğrular (KURALLAR 5, adım 4).
// İşletme izolasyonu sistemin en kritik güvenlik kuralıdır (MIMARI §5).

export async function assertBranchBelongsToBusiness(
  branchId: string,
  businessId: string,
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, businessId, deletedAt: null },
    select: { id: true },
  });
  if (!branch) throw new ActionError("Şube bulunamadı.");
}
