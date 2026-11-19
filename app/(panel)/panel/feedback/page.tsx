import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { LockIcon, MessageSquareIcon, StarIcon } from "lucide-react";
import { deleteFeedback } from "@/actions/feedback-admin";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { PageHeader } from "@/components/panel/page-header";
import { BarList } from "@/components/panel/stats";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import {
  getFeedbackSummary,
  listFeedback,
  markFeedbackRead,
  type Rating,
} from "@/lib/feedback";
import { formatDate } from "@/lib/format";
import { getLanguage, isLanguageCode } from "@/lib/languages";
import { canUseFeedback, readPlanFeatures } from "@/lib/plan-features";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { StatsBranchSelect } from "../stats/branch-select";

export const metadata: Metadata = { title: "Değerlendirmeler" };

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} yıldız`}
      className="flex gap-0.5 text-amber-500"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          aria-hidden
          className={
            n <= rating
              ? "size-4 fill-current"
              : "size-4 text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}

/**
 * Müşterilerin menüden bıraktığı değerlendirmeler (yalnızca işletme sahibi).
 * Paket "Müşteri değerlendirmeleri"ni içermiyorsa kilit kartı gösterilir.
 */
export default async function FeedbackPage({
  searchParams,
}: PageProps<"/panel/feedback">) {
  const { businessId, viewOnly } = await requireOwnerSession();
  const [{ subscription }, branches, params] = await Promise.all([
    getBusinessContext(businessId),
    db.branch.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    searchParams,
  ]);

  const header = (
    <PageHeader
      title="Değerlendirmeler"
      description="Müşterilerinizin menüden bıraktığı puan ve mesajlar."
    />
  );

  if (!canUseFeedback(readPlanFeatures(subscription?.plan.features))) {
    return (
      <>
        {header}
        <Card className="max-w-2xl">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <LockIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">
              Paketiniz müşteri değerlendirmelerini içermiyor.
            </p>
            <p className="text-sm text-muted-foreground">
              Müşterilerinizin menüden puan ve mesaj bırakabilmesi için
              paketinizi yükseltin. Bunun için bizimle iletişime geçin.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  // Şube yalnızca bu işletmenin şubeleri arasından seçilebilir (MIMARI §5).
  const branch = branches.find((b) => b.id === params.branch) ?? null;
  const scope = branch ? [branch.id] : branches.map((b) => b.id);
  const pageParam = Number(params.page);
  const page = Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1;

  const [summary, { items, hasMore }] = await Promise.all([
    getFeedbackSummary(scope),
    listFeedback(scope, page),
  ]);

  // Görüntülenen yeni değerlendirmeler yanıttan sonra okundu sayılır. Yönetici
  // "işletmenin gözünden bak" modundaysa işaretlenmez.
  const unreadIds = items.filter((f) => !f.readAt).map((f) => f.id);
  if (unreadIds.length && !viewOnly) after(() => markFeedbackRead(unreadIds));

  const href = (next: number) => {
    const query = new URLSearchParams({
      ...(branch && { branch: branch.id }),
      ...(next > 1 && { page: String(next) }),
    });
    return `/panel/feedback${query.size ? `?${query}` : ""}`;
  };

  return (
    <>
      {header}

      {branches.length > 1 && (
        <StatsBranchSelect branches={branches} value={branch?.id ?? null} />
      )}

      {summary.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MessageSquareIcon
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">Henüz değerlendirme yok.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Müşterileriniz menünün altındaki “Bizi değerlendirin” butonuyla
              puan ve mesaj bırakabilir. Değerlendirmeler anonimdir.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section
            aria-label="Değerlendirme özeti"
            className="grid gap-4 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
          >
            <Card>
              <CardHeader>
                <CardDescription>Ortalama puan</CardDescription>
                <CardTitle className="text-4xl tabular-nums">
                  {summary.average!.toLocaleString("tr-TR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / 5
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Stars rating={Math.round(summary.average!)} />
                <p className="text-sm text-muted-foreground">
                  {summary.total} değerlendirme
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Puan dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <BarList
                  unit="değerlendirme"
                  showShare
                  rows={([5, 4, 3, 2, 1] as Rating[]).map((r) => ({
                    key: String(r),
                    label: `${r} yıldız`,
                    value: summary.counts[r],
                  }))}
                />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Son değerlendirmeler</CardTitle>
              <CardDescription>
                En yeni en üstte. İstenmeyen bir değerlendirmeyi silebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Bu sayfada değerlendirme yok.
                </p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {items.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
                    >
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <Stars rating={f.rating} />
                          {!f.readAt && (
                            <span className="rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                              Yeni
                            </span>
                          )}
                        </div>
                        {f.message ? (
                          <p className="text-sm break-words whitespace-pre-line">
                            {f.message}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Mesaj yazılmamış.
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(f.createdAt)}
                          {branches.length > 1 && ` · ${f.branch.name}`}
                          {isLanguageCode(f.language) &&
                            ` · ${getLanguage(f.language).native}`}
                        </p>
                      </div>
                      <ConfirmButton
                        destructive
                        title="Değerlendirme silinsin mi?"
                        description="Bu değerlendirme kalıcı olarak silinir."
                        confirmLabel="Sil"
                        successMessage="Değerlendirme silindi."
                        onConfirm={deleteFeedback.bind(null, {
                          feedbackId: f.id,
                        })}
                      >
                        Sil
                      </ConfirmButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {(page > 1 || hasMore) && (
            <nav aria-label="Sayfalar" className="flex justify-between gap-3">
              {page > 1 ? (
                <Link
                  href={href(page - 1)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Daha yeni
                </Link>
              ) : (
                <span />
              )}
              {hasMore && (
                <Link
                  href={href(page + 1)}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Daha eski
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}
