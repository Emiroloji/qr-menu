import type { Metadata } from "next";
import Link from "next/link";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  QrCodeIcon,
} from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { QR_TEMPLATES } from "@/lib/pdf/qr-templates";
import { getLanguage, isLanguageCode } from "@/lib/languages";
import { activeCustomDomain } from "@/lib/domains";
import { menuUrl } from "@/lib/qr";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { BranchSwitcher } from "../menu/_components/branch-switcher";
import { CopyLink } from "./copy-link";

export const metadata: Metadata = { title: "QR kodlar" };

export default async function QrPage({ searchParams }: PageProps<"/panel/qr">) {
  const { businessId } = await requireOwnerSession();
  const [{ business, subscription }, branches, params] = await Promise.all([
    getBusinessContext(businessId),
    db.branch.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true, name: true, slug: true, languages: true },
      orderBy: { createdAt: "asc" },
    }),
    searchParams,
  ]);

  if (branches.length === 0) {
    return (
      <>
        <PageHeader title="QR kodlar" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <QrCodeIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">
              QR kodu almak için önce bir şube ekleyin.
            </p>
            <Link href="/panel/branches/new" className={buttonVariants()}>
              Şube ekle
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  const branch = branches.find((b) => b.id === params.branch) ?? branches[0];
  const url = menuUrl(
    business.slug,
    branch.slug,
    activeCustomDomain(business, subscription?.plan.features),
  );
  const api = `/api/qr/${branch.id}`;
  const pdf = `/api/pdf/${branch.id}`;
  // Alerjen tablosu şubenin dillerinde (PDF yazı tipi Arapça içermez).
  const documentLanguages = branch.languages
    .filter(isLanguageCode)
    .filter((l) => l !== "ar");

  return (
    <>
      <PageHeader
        title="QR ve belgeler"
        description="Her şubenin tek bir QR kodu vardır. Menüyü güncellediğinizde kodu yeniden bastırmanız gerekmez."
        actions={
          branches.length > 1 && (
            <BranchSwitcher
              branches={branches}
              value={branch.id}
              basePath="/panel/qr"
            />
          )
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{branch.name} şubesi</CardTitle>
            <CardDescription className="font-mono break-all">
              {url}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG oturumlu API'den geliyor; next/image optimizasyonu gereksiz */}
            <img
              src={`${api}?format=svg`}
              alt={`${branch.name} şubesinin menü QR kodu`}
              width={256}
              height={256}
              className="aspect-square w-full rounded-lg border bg-white p-2"
            />
            <div className="flex flex-wrap gap-2">
              <a
                href={`${api}?format=png&download=1`}
                className={buttonVariants({ size: "sm" })}
                download
              >
                <DownloadIcon />
                PNG
              </a>
              <a
                href={`${api}?format=svg&download=1`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
                download
              >
                <DownloadIcon />
                SVG
              </a>
              <CopyLink url={url} />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ size: "sm", variant: "ghost" })}
              >
                <ExternalLinkIcon />
                Menüyü aç
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              PNG: dijital kullanım ve ofis yazıcısı. SVG: matbaa ve büyük
              baskılar (kalite kaybı olmaz).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baskı şablonları</CardTitle>
            <CardDescription>
              İşletme adınız, logonuz ve renginizle hazır PDF. Talimat satırı
              şubenizin menü dillerinde yazılır.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {Object.entries(QR_TEMPLATES).map(([key, template]) => (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-xl border p-4"
              >
                <FileTextIcon
                  className="size-6 text-muted-foreground"
                  aria-hidden
                />
                <div className="flex flex-col gap-1">
                  <h3 className="font-medium">{template.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  <a
                    href={`${api}?format=pdf&template=${key}&download=1`}
                    className={buttonVariants({ size: "sm" })}
                    download
                  >
                    <DownloadIcon />
                    PDF indir
                  </a>
                  <a
                    href={`${api}?format=pdf&template=${key}`}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Önizle
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Yasal belgeler</CardTitle>
            <CardDescription>
              Menünüzdeki bilgilerle anında üretilir; menüyü güncellediğinizde
              yeniden indirmeniz yeterli.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">Alerjen tablosu</h3>
                <p className="text-sm text-muted-foreground">
                  Şubedeki tüm ürünler × 14 alerjen. Denetimlerde gösterebilir,
                  müşteriye verebilirsiniz. Müşteriler menüden de indirebilir.
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                {documentLanguages.map((l) => (
                  <a
                    key={l}
                    href={`${pdf}?type=allergens&lang=${l}&download=1`}
                    className={buttonVariants({
                      size: "sm",
                      variant: l === "tr" ? "default" : "outline",
                    })}
                    download
                  >
                    <DownloadIcon />
                    {getLanguage(l).name}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">Basılı menü</h3>
                <p className="text-sm text-muted-foreground">
                  Fiyatlı, logonuz ve renginizle A4 menü. Masada basılı menü
                  bulundurma zorunluluğu için.
                </p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <a
                  href={`${pdf}?type=menu&download=1`}
                  className={buttonVariants({ size: "sm" })}
                  download
                >
                  <DownloadIcon />
                  PDF indir
                </a>
                <a
                  href={`${pdf}?type=menu`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  Önizle
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
