import { db } from "@/lib/db";
import {
  getExportProducts,
  getSheetReference,
  writeMenuWorkbook,
} from "@/lib/menu-excel";
import { hasAnyMenuPermission } from "@/lib/permissions";
import { getPanelIdentity } from "@/lib/session";

/**
 * Şube menüsünün Excel dosyası (Faz 3.3). Menü ekranına erişimi olan herkes indirebilir;
 * yalnızca kendi işletmesinin şubesi. Boş menüde dosya doldurulacak şablondur.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/excel/[branchId]">,
) {
  const identity = await getPanelIdentity();
  if (!identity || !hasAnyMenuPermission(identity.user))
    return Response.json(
      { error: "Bu işlem için yetkiniz yok." },
      { status: 403 },
    );

  const { branchId } = await params;
  const branch = await db.branch.findFirst({
    where: { id: branchId, businessId: identity.businessId, deletedAt: null },
    select: { id: true, slug: true, business: { select: { slug: true } } },
  });
  if (!branch)
    return Response.json({ error: "Şube bulunamadı." }, { status: 404 });

  const [products, reference] = await Promise.all([
    getExportProducts(branch.id),
    getSheetReference(),
  ]);
  const file = await writeMenuWorkbook(products, reference);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="menu-${branch.business.slug}-${branch.slug}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
