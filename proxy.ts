import { type NextRequest, NextResponse } from "next/server";
import { hostOf, isPlatformHost } from "@/lib/custom-domain";
import { RESERVED_SLUGS } from "@/lib/validations/business";

// İşletmenin kendi alan adı (Faz 3.2): menu.isletme.com/{şube} → /site/{alan-adı}/{şube}.
// Alan adında yalnızca menü, yasal sayfalar ve alerjen PDF'i açılır; panel, giriş vb.
// platformun kendi adresine yönlendirilir. Veritabanına burada erişilmez; alan adı
// /site rotasında çözülür (Next.js proxy önerisi).

const MENU_PATH = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)?\/?$/;
const PASS_THROUGH = [/^\/api\/pdf\//, /^\/kvkk$/, /^\/kullanim-kosullari$/];

export function proxy(request: NextRequest) {
  const host = hostOf(request.headers.get("host"));
  if (!host || isPlatformHost(host)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  if (PASS_THROUGH.some((pattern) => pattern.test(pathname)))
    return NextResponse.next();

  const match = MENU_PATH.exec(pathname);
  // /panel, /login gibi sistem adresleri şube adı sayılmaz; platforma gider.
  if (match && !RESERVED_SLUGS.includes(match[1] ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = `/site/${host}${match[1] ? `/${match[1]}` : ""}`;
    return NextResponse.rewrite(url);
  }

  const platform = process.env.NEXT_PUBLIC_APP_URL;
  if (!platform) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(new URL(`${pathname}${search}`, platform));
}

export const config = {
  // Next.js dosyaları ve uzantılı statik dosyalar (favicon, görseller) hariç.
  matcher: ["/((?!_next/|.*\\.[a-z0-9]+$).*)"],
};
