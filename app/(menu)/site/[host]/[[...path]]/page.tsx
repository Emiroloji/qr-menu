import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BranchChooser } from "@/components/menu/branch-chooser";
import { getDomainSite } from "@/lib/domains";
import { menuUrl } from "@/lib/qr";
import { MenuScreen, menuMetadata } from "../../../menu-screen";

type Props = PageProps<"/site/[host]/[[...path]]">;

/**
 * İşletmenin kendi alan adı (Faz 3.2). proxy.ts, `menu.isletme.com/{şube}` isteğini
 * buraya yönlendirir. Tek şube varsa ana sayfa doğrudan o şubenin menüsüdür.
 */
async function resolve(params: Props["params"]) {
  const { host, path = [] } = await params;
  const site = await getDomainSite(decodeURIComponent(host));
  if (!site || path.length > 1) notFound();
  const branch =
    path.length === 1
      ? site.branches.find((b) => b.slug === path[0])
      : site.branches.length === 1
        ? site.branches[0]
        : undefined;
  if (path.length === 1 && !branch) notFound();
  return { site, branch, path };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site, branch } = await resolve(params);
  return branch
    ? menuMetadata(site.businessSlug, branch.slug)
    : { title: site.businessName };
}

export default async function DomainPage({ params, searchParams }: Props) {
  const [{ site, branch, path }, search] = await Promise.all([
    resolve(params),
    searchParams,
  ]);
  const lang = typeof search.lang === "string" ? search.lang : null;

  // Paket artık alan adını içermiyorsa ziyaretçi platformdaki menüye gider;
  // basılı QR kodlar çalışmaya devam eder.
  if (!site.allowed) {
    const target = branch
      ? menuUrl(site.businessSlug, branch.slug)
      : menuUrl(site.businessSlug, site.branches[0]?.slug ?? "");
    redirect(lang ? `${target}?lang=${encodeURIComponent(lang)}` : target);
  }

  if (!branch) {
    if (site.branches.length === 0) notFound();
    return (
      <BranchChooser
        businessName={site.businessName}
        branches={site.branches}
      />
    );
  }
  return (
    <MenuScreen
      business={site.businessSlug}
      branch={branch.slug}
      lang={lang}
      path={path.length === 1 ? `/${branch.slug}` : "/"}
    />
  );
}
