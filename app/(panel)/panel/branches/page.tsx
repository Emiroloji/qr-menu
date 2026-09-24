import type { Metadata } from "next";
import Link from "next/link";
import { ClockIcon, MapPinIcon, PlusIcon, WifiIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { isWithinLimit } from "@/lib/plan-limits";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { DAYS, type OpeningHours } from "@/lib/validations/branch";

export const metadata: Metadata = { title: "Şubeler" };

function hoursSummary(hours: OpeningHours) {
  const open = DAYS.filter(([day]) => hours[day]?.length);
  if (open.length === 0) return "Çalışma saati girilmemiş";
  const ranges = new Set(
    open.map(([day]) => hours[day]!.map((r) => r.join("–")).join(", ")),
  );
  const range = ranges.size === 1 ? [...ranges][0] : "farklı saatler";
  return open.length === 7
    ? `Her gün ${range}`
    : `Haftada ${open.length} gün, ${range}`;
}

export default async function BranchesPage() {
  const { businessId } = await requireOwnerSession();
  const [{ business, subscription }, branches] = await Promise.all([
    getBusinessContext(businessId),
    db.branch.findMany({
      where: { businessId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const limit = subscription?.plan.maxBranches ?? null;
  const canAdd =
    subscription !== null && isWithinLimit(limit, branches.length + 1);

  return (
    <>
      <PageHeader
        title="Şubeler"
        description={`Her şubenin kendi menüsü ve QR kodu olur. ${branches.length} / ${limit ?? "sınırsız"} şube kullanılıyor.`}
        actions={
          canAdd ? (
            <Link href="/panel/branches/new" className={buttonVariants()}>
              <PlusIcon />
              Şube ekle
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">
              Şube limitine ulaştınız. Daha fazlası için paketinizi yükseltin.
            </span>
          )
        }
      />

      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MapPinIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">Henüz şube yok</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Menünüzü oluşturmak ve QR kodu almak için ilk şubenizi ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/panel/branches/${branch.id}`}
                    className="hover:underline"
                  >
                    {branch.name}
                  </Link>
                </CardTitle>
                <p className="font-mono text-xs text-muted-foreground">
                  /{business.slug}/{branch.slug}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {branch.address ?? "Adres girilmemiş"}
                </p>
                <p className="flex items-center gap-2">
                  <ClockIcon className="size-4 shrink-0" aria-hidden />
                  {hoursSummary(branch.openingHours as OpeningHours)}
                </p>
                {branch.wifi && (
                  <p className="flex items-center gap-2">
                    <WifiIcon className="size-4 shrink-0" aria-hidden />
                    Wi-Fi bilgisi var
                  </p>
                )}
                <Link
                  href={`/panel/branches/${branch.id}`}
                  className={buttonVariants({
                    variant: "outline",
                    className: "mt-2 w-fit",
                  })}
                >
                  Düzenle
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
