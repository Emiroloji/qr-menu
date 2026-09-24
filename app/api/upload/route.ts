import { randomUUID } from "node:crypto";
import { ActionError } from "@/lib/action";
import { expireBranchMenu, expireBusinessMenus } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  isAllowedImage,
  MAX_IMAGE_SIZE,
  toLogo,
  toProductImages,
} from "@/lib/images";
import { assertProductBelongsToBusiness } from "@/lib/ownership";
import { assertOwner, requirePermission } from "@/lib/permissions";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles, publicUrl, uploadFile } from "@/lib/storage";

const MAX_PRODUCT_IMAGES = 10;

const error = (message: string, status: number) =>
  Response.json({ error: message }, { status });

/**
 * Görsel yükleme (MIMARI §9).
 * - `?kind=logo`: işletme logosu (yalnızca sahip)
 * - `?kind=product&productId=…`: ürün görseli, 400/800/1200 px + bulanık önizleme
 * Yetki, dosya gövdesi okunmadan önce kontrol edilir.
 */
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");

  let context;
  let product: { id: string; branchId: string } | null = null;
  try {
    context = await requireWritableSession();
    if (kind === "logo") {
      await assertOwner(context.user);
    } else if (kind === "product") {
      await requirePermission(context.user, "PRODUCT_EDIT");
      const productId = params.get("productId");
      if (!productId) return error("Ürün seçin.", 400);
      product = await assertProductBelongsToBusiness(
        productId,
        context.businessId,
      );
      const count = await db.productImage.count({ where: { productId } });
      if (count >= MAX_PRODUCT_IMAGES) {
        return error(
          `Bir ürüne en fazla ${MAX_PRODUCT_IMAGES} görsel eklenebilir.`,
          400,
        );
      }
    } else {
      return error("Geçersiz yükleme türü.", 400);
    }
  } catch (e) {
    if (e instanceof ActionError) return error(e.message, 403);
    throw e;
  }
  const { businessId, business } = context;

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return error("Dosya seçin.", 400);
  if (file.size > MAX_IMAGE_SIZE)
    return error("Dosya en fazla 10 MB olabilir.", 413);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!(await isAllowedImage(buffer))) {
    return error("Yalnızca JPEG, PNG veya WebP görsel yükleyebilirsiniz.", 415);
  }

  if (product) {
    const { sizes, blurDataUrl } = await toProductImages(buffer);
    const base = `business/${businessId}/products/${product.id}/${randomUUID()}`;
    await Promise.all(
      sizes.map((s) =>
        uploadFile(`${base}-${s.width}.webp`, s.buffer, "image/webp"),
      ),
    );
    const last = await db.productImage.aggregate({
      where: { productId: product.id },
      _max: { sortOrder: true },
    });
    const image = await db.productImage.create({
      data: {
        productId: product.id,
        url: publicUrl(base),
        blurDataUrl,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
    });
    expireBranchMenu(product.branchId);
    return Response.json({ image });
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
