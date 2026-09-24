import { ALLERGEN_ORDER } from "@/lib/allergens";
import {
  getBusinessStatus,
  getCurrentSubscription,
  isBusinessOperational,
} from "@/lib/business-status";
import { onColor, readableOn } from "@/lib/color";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { pickLanguage } from "@/lib/languages";
import { getCachedMenuData, getMenuReference } from "@/lib/menu-data";
import { getMenuMessages } from "@/lib/menu-messages";
import { effectiveAppearance } from "@/lib/menu-themes";
import { renderAllergenPdf } from "@/lib/pdf/allergen-document";
import { logoPng } from "@/lib/pdf/logo";
import { renderPrintedMenuPdf } from "@/lib/pdf/printed-menu";
import { readPlanFeatures } from "@/lib/plan-features";
import { menuUrl, qrPng } from "@/lib/qr";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Yasal belgeler (MIMARI §10, Faz 2.1). İsteğe göre üretilir, saklanmaz.
 * - `?type=allergens&lang=xx`: alerjen tablosu — herkese açık (müşteri menüden indirir)
 * - `?type=menu`: fiyatlı basılı menü — yalnızca işletme sahibi
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/pdf/[branchId]">,
) {
  const { branchId } = await params;
  const search = new URL(request.url).searchParams;
  const type = search.get("type");
  if (type !== "allergens" && type !== "menu")
    return error("Geçersiz belge türü.", 400);

  const branch = await db.branch.findUnique({
    where: { id: branchId, deletedAt: null },
    include: {
      business: { include: { subscriptions: { include: { plan: true } } } },
    },
  });
  if (!branch || branch.business.deletedAt)
    return error("Şube bulunamadı.", 404);
  const { business } = branch;

  const user = await getCurrentUser();
  const isOwner = user?.role === "OWNER" && user.businessId === business.id;
  if (type === "menu" && !isOwner)
    return error("Bu işlem için yetkiniz yok.", 403);
  if (!isOwner) {
    // Herkese açık belge: menü yayında olmalı; sunucuyu yormamak için hız sınırı.
    if (!isBusinessOperational(getBusinessStatus(business)))
      return error("Şube bulunamadı.", 404);
    if (
      !consumeRateLimit(`pdf:${clientIp(request.headers)}`, {
        limit: 20,
        windowMs: 10 * 60_000,
      })
    ) {
      return error("Çok fazla istek. Lütfen biraz sonra tekrar deneyin.", 429);
    }
  }

  // PDF yazı tipi Arapça içermez; Arapça seçiliyse İngilizce belge üretilir.
  let lang = pickLanguage(search.get("lang"), branch.languages, null);
  if (lang === "ar") lang = "en";
  const [data, reference] = await Promise.all([
    getCachedMenuData(branch.id, lang),
    getMenuReference(lang),
  ]);
  if (!data) return error("Şube bulunamadı.", 404);

  const names = new Map(reference.allergens.map((a) => [a.code, a.name]));
  const allergens = ALLERGEN_ORDER.map((code) => ({
    code,
    name: names.get(code) ?? code,
  }));
  const appearance = effectiveAppearance(
    business,
    readPlanFeatures(
      getCurrentSubscription(business.subscriptions)?.plan.features,
    ),
  );
  const messages = getMenuMessages(lang);
  const accentText = readableOn(appearance.color, "#FFFFFF");
  const date = formatDate(new Date());
  const filename =
    type === "allergens"
      ? `alerjen-${business.slug}-${branch.slug}`
      : `menu-${business.slug}-${branch.slug}`;

  const pdf =
    type === "allergens"
      ? await renderAllergenPdf({
          lang,
          businessName: business.name,
          branchName: branch.name,
          accentText,
          allergens,
          categories: data.categories,
          text: {
            title: messages.allergenTableTitle,
            product: messages.product,
            contains: messages.contains,
            mayContain: messages.mayContain,
            note: messages.allergenTableNote,
            generatedOn: messages.generatedOn.replace("{date}", date),
          },
        })
      : await renderPrintedMenuPdf({
          lang,
          businessName: business.name,
          branchName: branch.name,
          logo: await logoPng(appearance.logoUrl),
          qr: await qrPng(menuUrl(business.slug, branch.slug), 600),
          displayUrl: menuUrl(business.slug, branch.slug).replace(
            /^https?:\/\//,
            "",
          ),
          accent: appearance.color,
          onAccent: onColor(appearance.color),
          accentText,
          allergens,
          categories: data.categories,
          text: {
            allergens: messages.allergens,
            note: messages.allergenNote,
            scan: messages.digitalMenu,
          },
        });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${search.has("download") ? "attachment" : "inline"}; filename="${filename}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
