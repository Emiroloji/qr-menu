import "server-only";
import sharp from "sharp";
import { PRODUCT_IMAGE_SIZES } from "@/lib/product-image";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB (MIMARI §9)
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

/** Dosyanın gerçekten JPEG, PNG veya WebP olup olmadığını içeriğinden kontrol eder. */
export async function isAllowedImage(buffer: Buffer) {
  try {
    const { format } = await sharp(buffer).metadata();
    return format !== undefined && ALLOWED_FORMATS.has(format);
  } catch {
    return false;
  }
}

/** Logo: en fazla 512×512, oranı korunur, saydamlık korunur, WebP. */
export function toLogo(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

/** Ürün görseli: 400, 800 ve 1200 px genişlikte WebP + küçük bulanık önizleme (MIMARI §9). */
export async function toProductImages(buffer: Buffer) {
  const base = sharp(buffer).rotate();
  const sizes = await Promise.all(
    PRODUCT_IMAGE_SIZES.map(async (width) => ({
      width,
      buffer: await base
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer(),
    })),
  );
  const blur = await base
    .clone()
    .resize({ width: 16 })
    .webp({ quality: 40 })
    .toBuffer();
  return {
    sizes,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}
