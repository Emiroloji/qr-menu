import "server-only";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// Cloudflare R2 (S3 uyumlu). Yerelde R2_ENDPOINT ile S3Mock kullanılır.
const endpoint =
  process.env.R2_ENDPOINT ||
  `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3 = new S3Client({
  region: "auto",
  endpoint,
  forcePathStyle: Boolean(process.env.R2_ENDPOINT),
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const bucket = process.env.R2_BUCKET;
const publicBase = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/** Dosyayı yükler ve herkese açık adresini döner. Anahtarlar değişmez, önbellek uzun tutulur. */
export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${publicBase}/${key}`;
}

/** Bu depolamaya ait adresleri siler; başka adresleri yok sayar. */
export async function deleteFiles(urls: string[]) {
  const keys = urls
    .filter((url) => url.startsWith(`${publicBase}/`))
    .map((url) => url.slice(publicBase.length + 1));
  await Promise.all(
    keys.map((Key) =>
      s3.send(new DeleteObjectCommand({ Bucket: bucket, Key })),
    ),
  );
}
