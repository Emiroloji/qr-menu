import { ActionError } from "@/lib/action";
import { expireBusinessMenus } from "@/lib/cache";
import { db } from "@/lib/db";
import { isAllowedImage, MAX_IMAGE_SIZE, toLogo } from "@/lib/images";
import { assertOwner } from "@/lib/permissions";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles, uploadFile } from "@/lib/storage";

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Görsel yükleme (MIMARI §9). Şimdilik yalnızca işletme logosu (`kind=logo`);
 * ürün görselleri Faz 1.5'te eklenir.
 */
export async function POST(request: Request) {
  let context;
  try {
    context = await requireWritableSession();
    await assertOwner(context.user);
  } catch (e) {
    if (e instanceof ActionError) return error(e.message, 403);
    throw e;
  }
  const { businessId, business } = context;

  const form = await request.formData();
  const file = form.get("file");
  if (form.get("kind") !== "logo") return error("Geçersiz yükleme türü.", 400);
  if (!(file instanceof File)) return error("Dosya seçin.", 400);
  if (file.size > MAX_IMAGE_SIZE)
    return error("Dosya en fazla 10 MB olabilir.", 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!(await isAllowedImage(buffer))) {
    return error("Yalnızca JPEG, PNG veya WebP görsel yükleyebilirsiniz.", 415);
  }

  const logo = await toLogo(buffer);
  const url = await uploadFile(
    `business/${businessId}/logo-${Date.now()}.webp`,
    logo,
    "image/webp",
  );
  await db.business.update({
    where: { id: businessId },
    data: { logoUrl: url },
  });
  if (business.logoUrl) await deleteFiles([business.logoUrl]);
  await expireBusinessMenus(businessId);

  return Response.json({ url });
}
