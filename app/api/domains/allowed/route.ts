import { normalizeDomain } from "@/lib/custom-domain";
import { getDomainSite } from "@/lib/domains";

/**
 * Caddy "on-demand TLS" sorgusu (Faz 3.2): yalnızca doğrulanmış bir işletme alan adı
 * için SSL sertifikası alınır; böylece sunucuyu gösteren rastgele alan adlarına
 * sertifika üretilmez. Paketi alan adını artık içermeyen işletmeye de izin verilir;
 * ziyaretçi HTTPS ile gelip platformdaki menüye yönlendirilir.
 */
export async function GET(request: Request) {
  const domain = normalizeDomain(
    new URL(request.url).searchParams.get("domain") ?? "",
  );
  const site = domain ? await getDomainSite(domain) : null;
  return new Response(null, { status: site ? 200 : 404 });
}
