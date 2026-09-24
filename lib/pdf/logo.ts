import "server-only";
import sharp from "sharp";

/** PDF WebP desteklemez: logo PNG'ye çevrilir. Alınamazsa null (belge logosuz üretilir). */
export async function logoPng(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await sharp(Buffer.from(await response.arrayBuffer()))
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}
