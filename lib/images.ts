import "server-only";
import sharp from "sharp";

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
