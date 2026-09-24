import type { NextConfig } from "next";

// Görseller R2'den (yerelde S3Mock'tan) next/image ile sunulur.
const storageUrl = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL)
  : null;

const nextConfig: NextConfig = {
  // VPS'te Docker ile çalışır: yalnızca gereken dosyaları içeren tek başına sunucu.
  output: "standalone",
  // PDF yazı tipleri dosyadan okunur; izleyici bunları kendiliğinden bulamaz.
  outputFileTracingIncludes: { "/api/qr/*": ["./assets/fonts/**/*"] },
  images: {
    remotePatterns: storageUrl
      ? [
          new URL(
            `${storageUrl.origin}${storageUrl.pathname.replace(/\/$/, "")}/**`,
          ),
        ]
      : [],
    // Yerel S3Mock localhost'ta çalıştığı için yalnızca geliştirmede izin verilir.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
