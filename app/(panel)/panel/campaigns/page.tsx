import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageIcon, MegaphoneIcon, PencilIcon, PlusIcon } from "lucide-react";
import { deleteCampaign } from "@/actions/campaign";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CAMPAIGN_STATUS_LABELS,
  type CampaignStatus,
  campaignStatus,
  MAX_SPECIAL_DAYS_AHEAD,
  specialDateFromKey,
  specialDateKey,
} from "@/lib/campaigns";
import { db } from "@/lib/db";
import { formatDate, toDateInputValue } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { productImageSrc } from "@/lib/product-image";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { BranchSwitcher } from "../menu/_components/branch-switcher";
import { DailySpecial } from "./_components/daily-special";
import { FeaturedProducts } from "./_components/featured-products";

export const metadata: Metadata = { title: "Kampanyalar" };

const DAY_MS = 24 * 60 * 60 * 1000;
const STATUS_ORDER: CampaignStatus[] = ["LIVE", "SCHEDULED", "OFF", "ENDED"];
const STATUS_STYLES: Record<CampaignStatus, string> = {
  LIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  SCHEDULED: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  OFF: "bg-muted text-foreground",
  ENDED: "bg-muted text-muted-foreground",
};

/** Kampanya banner'ı, günün önerisi ve öne çıkan ürünler (FAZLAR 2.3). */
export default async function CampaignsPage({
  searchParams,
}: PageProps<"/panel/campaigns">) {
  const { user, businessId } = await requireSession();
  if (!hasPermission(user, "CAMPAIGN_EDIT")) redirect("/panel");

  const [branches, params] = await Promise.all([
    db.branch.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    searchParams,
  ]);

  if (branches.length === 0) {
    return (
      <>
        <PageHeader title="Kampanyalar" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MegaphoneIcon
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">
              Kampanya eklemek için önce bir şube gerekiyor.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  // Şube yalnızca bu işletmenin şubeleri arasından seçilebilir (MIMARI §5).
  const branch = branches.find((b) => b.id === params.branch) ?? branches[0];
  const now = new Date();
  const today = toDateInputValue(now);

  const [campaigns, products, specials] = await Promise.all([
    db.campaign.findMany({
      where: { branchId: branch.id },
      orderBy: { startsAt: "desc" },
    }),
    db.product.findMany({
      where: {
        deletedAt: null,
        category: { branchId: branch.id, deletedAt: null },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        isFeatured: true,
        isVisible: true,
        category: { select: { name: true } },
      },
    }),
    db.dailySpecial.findMany({
      where: { branchId: branch.id, date: { gte: specialDateFromKey(today) } },
      orderBy: { date: "asc" },
      include: { product: { select: { name: true, deletedAt: true } } },
    }),
  ]);

  const sorted = campaigns
    .map((c) => ({ ...c, status: campaignStatus(c, now) }))
    .sort(
      (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    );
  const options = products
    .filter((p) => p.isVisible)
    .map((p) => ({ id: p.id, name: p.name, category: p.category.name }));
  const tomorrow = toDateInputValue(new Date(now.getTime() + DAY_MS));

  return (
    <>
      <PageHeader
        title="Kampanyalar"
        description="Menünün üstünde kampanyalar, günün önerisi ve öne çıkan ürünler görünür."
        actions={
          <>
            {branches.length > 1 && (
              <BranchSwitcher
                branches={branches}
                value={branch.id}
                basePath="/panel/campaigns"
              />
            )}
            <Link
              href={`/panel/campaigns/new?branch=${branch.id}`}
              className={buttonVariants()}
            >
              <PlusIcon />
              Yeni kampanya
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Kampanya banner&apos;ları</CardTitle>
          <CardDescription>
            Yayındaki kampanyalar menünün en üstünde, kaydırılabilir kartlar
            olarak görünür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kampanya yok.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {sorted.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap"
                >
                  <div className="relative flex aspect-2/1 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {c.imageUrl ? (
                      <Image
                        src={productImageSrc(c.imageUrl, 400)}
                        alt=""
                        fill
                        sizes="96px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon
                        className="size-5 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{c.title}</span>
                      <Badge
                        className={cn(
                          "border-transparent",
                          STATUS_STYLES[c.status],
                        )}
                      >
                        {CAMPAIGN_STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(c.startsAt)} – {formatDate(c.endsAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/panel/campaigns/${c.id}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      <PencilIcon />
                      Düzenle
                    </Link>
                    <ConfirmButton
                      destructive
                      title="Kampanya silinsin mi?"
                      description={`“${c.title}” ve görseli kalıcı olarak silinir.`}
                      confirmLabel="Sil"
                      successMessage="Kampanya silindi."
                      onConfirm={deleteCampaign.bind(null, {
                        campaignId: c.id,
                      })}
                    >
                      Sil
                    </ConfirmButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Günün önerisi</CardTitle>
            <CardDescription>
              Seçtiğiniz gün menüde öne çıkan tek ürün. {MAX_SPECIAL_DAYS_AHEAD}{" "}
              güne kadar önceden planlayabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailySpecial
              branchId={branch.id}
              products={options}
              today={today}
              lastDay={toDateInputValue(
                new Date(now.getTime() + MAX_SPECIAL_DAYS_AHEAD * DAY_MS),
              )}
              specials={specials
                .filter((s) => !s.product.deletedAt)
                .map((s) => {
                  const key = specialDateKey(s.date);
                  return {
                    id: s.id,
                    productName: s.product.name,
                    isToday: key === today,
                    dateLabel:
                      key === today
                        ? "Bugün"
                        : key === tomorrow
                          ? "Yarın"
                          : formatDate(new Date(`${key}T12:00:00+03:00`)),
                  };
                })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Öne çıkan ürünler</CardTitle>
            <CardDescription>
              Menünün üstünde yatay bir şeritte gösterilir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeaturedProducts
              products={options.filter(
                (o) => !products.find((p) => p.id === o.id)?.isFeatured,
              )}
              featured={products
                .filter((p) => p.isFeatured)
                .map((p) => ({
                  id: p.id,
                  name: p.isVisible ? p.name : `${p.name} (gizli)`,
                  category: p.category.name,
                }))}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
