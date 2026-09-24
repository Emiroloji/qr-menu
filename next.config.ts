import type { NextConfig } from "next";

// Görseller R2'den (yerelde S3Mock'tan) next/image ile sunulur.
const storageUrl = process.env.R2_PUBLIC_URL
  ? new URL(process.env.R2_PUBLIC_URL)
  : null;

const nextConfig: NextConfig = {
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
