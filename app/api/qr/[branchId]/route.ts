import { getCurrentSubscription } from "@/lib/business-status";
import { onColor, readableOn } from "@/lib/color";
import { db } from "@/lib/db";
import { isLanguageCode, type LanguageCode } from "@/lib/languages";
import { effectiveAppearance } from "@/lib/menu-themes";
import {
  QR_TEMPLATES,
  type QrTemplate,
  renderQrPdf,
} from "@/lib/pdf/qr-templates";
import { readPlanFeatures } from "@/lib/plan-features";
import { menuUrl, qrPng, qrSvg } from "@/lib/qr";
import { getPanelIdentity } from "@/lib/session";
import { logoPng } from "@/lib/pdf/logo";

// PDF yazı tipi Arapça içermediği için Arapça satır eklenmez.
const INSTRUCTIONS: Partial<Record<LanguageCode, string>> = {
  tr: "Menüyü görmek için QR kodu okutun",
  en: "Scan the QR code to see our menu",
  de: "QR-Code scannen, um die Speisekarte zu sehen",
  ru: "Отсканируйте QR-код, чтобы открыть меню",
};

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Şube QR kodu (MIMARI §10): `?format=svg|png|pdf`, PDF için `&template=table-card|sticker|poster`.
 * `&download=1` dosyayı indirir. Yalnızca işletme sahibi, yalnızca kendi şubesi.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/qr/[branchId]">,
) {
  // İşletme sahibi (veya işletmenin gözünden bakan süper admin).
  const identity = await getPanelIdentity();
  if (!identity || identity.user.role !== "OWNER") {
    return error("Bu işlem için yetkiniz yok.", 403);
  }
  const { branchId } = await params;
  const branch = await db.branch.findFirst({
    where: { id: branchId, businessId: identity.businessId, deletedAt: null },
    include: {
      business: { include: { subscriptions: { include: { plan: true } } } },
    },
  });
  if (!branch) return error("Şube bulunamadı.", 404);

  const { business } = branch;
  const url = menuUrl(business.slug, branch.slug);
  const search = new URL(request.url).searchParams;
  const format = search.get("format") ?? "svg";
  const filename = `qr-${business.slug}-${branch.slug}`;
  const disposition = (ext: string) =>
    `${search.has("download") ? "attachment" : "inline"}; filename="${filename}.${ext}"`;

  if (format === "svg") {
    return new Response(await qrSvg(url), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": disposition("svg"),
      },
    });
  }
  if (format === "png") {
    return new Response(new Uint8Array(await qrPng(url, 2048)), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": disposition("png"),
      },
    });
  }
  if (format !== "pdf") return error("Geçersiz biçim.", 400);

  const template = search.get("template") ?? "";
  if (!(template in QR_TEMPLATES)) return error("Geçersiz şablon.", 400);

  const appearance = effectiveAppearance(
    business,
    readPlanFeatures(
      getCurrentSubscription(business.subscriptions)?.plan.features,
    ),
  );
  const languages = branch.languages.filter(isLanguageCode);

  const pdf = await renderQrPdf(template as QrTemplate, {
    businessName: business.name,
    branchName: branch.name,
    url,
    displayUrl: url.replace(/^https?:\/\//, ""),
    qr: await qrPng(url, 1200),
    logo: await logoPng(appearance.logoUrl),
    accent: appearance.color,
    onAccent: onColor(appearance.color),
    accentText: readableOn(appearance.color, "#FFFFFF"),
    instructions: ["tr" as const, ...languages.filter((l) => l !== "tr")]
      .map((l) => INSTRUCTIONS[l])
      .filter((line): line is string => Boolean(line)),
    wifi: branch.wifi,
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition("pdf"),
    },
  });
}
