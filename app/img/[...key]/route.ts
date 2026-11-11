// Görsel aktarıcı: /img/{depo anahtarı} → R2'deki herkese açık dosya.
// R2'nin r2.dev adresi Türkiye'de engelli olduğu için tarayıcı görseli buradan alır
// (bkz. lib/product-image.ts → proxiedImageUrl). Sunucunun R2'ye erişimi engelsizdir.
// Dosya sunucuda saklanmaz, akış olarak iletilir; önbelleği tarayıcı tutar
// (anahtarlar değişmez olduğundan 1 yıl).

const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;

function storageOrigin() {
  try {
    return new URL(process.env.R2_PUBLIC_URL ?? "").origin;
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/img/[...key]">,
) {
  const { key } = await ctx.params;
  const origin = storageOrigin();
  if (!origin || !key.every((segment) => SEGMENT.test(segment)))
    return new Response(null, { status: 404 });

  const headers = new Headers();
  const etag = request.headers.get("if-none-match");
  if (etag) headers.set("if-none-match", etag);

  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/${key.join("/")}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return new Response(null, { status: 502 });
  }

  const cacheControl = "public, max-age=31536000, immutable";
  if (upstream.status === 304)
    return new Response(null, {
      status: 304,
      headers: { "cache-control": cacheControl },
    });

  const type = upstream.headers.get("content-type") ?? "";
  // Yalnızca görsel iletilir; depodan başka türde içerik kendi alan adımızdan sunulmaz.
  if (!upstream.ok || !type.startsWith("image/") || type.includes("svg")) {
    await upstream.body?.cancel();
    return new Response(null, {
      status: upstream.ok ? 404 : upstream.status === 404 ? 404 : 502,
    });
  }

  const out = new Headers({
    "content-type": type,
    "cache-control": cacheControl,
    "x-content-type-options": "nosniff",
  });
  for (const name of ["content-length", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(upstream.body, { status: 200, headers: out });
}
