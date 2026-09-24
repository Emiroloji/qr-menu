import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenIcon,
  MapPinIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { hasAnyMenuPermission, PERMISSION_LABELS } from "@/lib/permissions";
import { countUsage } from "@/lib/plan-limits";
import { getBusinessContext, requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Özet" };

function UsageCard({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {used}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {limit ?? "sınırsız"}
          </span>
        </p>
        {limit !== null && (
          <div
            role="progressbar"
            aria-label={`${label} kullanımı`}
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
            className="h-1.5 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function PanelPage() {
  const { user, businessId } = await requireSession();
  const { business, subscription } = await getBusinessContext(businessId);

  // Çalışan paket ve kullanım bilgilerini görmez; kendi yetkilerini görür (MIMARI §6).
  if (user.role === "STAFF") {
    const permissions = user.permissions.map((p) => p.permission);
    return (
      <>
        <PageHeader
          title={`Merhaba, ${user.name.split(" ")[0]}`}
          description={business.name}
        />
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Yetkileriniz</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Henüz size bir yetki verilmedi. İşletme sahibinizle görüşün.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {permissions.map((p) => (
                  <li key={p} className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium">
                      {PERMISSION_LABELS[p].label}
                    </span>
                    <span className="text-muted-foreground">
                      {PERMISSION_LABELS[p].description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {hasAnyMenuPermission(user) && (
              <Link
                href="/panel/menu"
                className={buttonVariants({ className: "w-fit" })}
              >
                <BookOpenIcon />
                Menüye git
              </Link>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  const [branches, products, staff] = await Promise.all([
    countUsage(businessId, "branches"),
    countUsage(businessId, "products"),
    countUsage(businessId, "staff"),
  ]);
  const plan = subscription?.plan;
  const isOwner = user.role === "OWNER";

  return (
    <>
      <PageHeader
        title={`Merhaba, ${user.name.split(" ")[0]}`}
        description={business.name}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <UsageCard
          label="Şubeler"
          used={branches}
          limit={plan?.maxBranches ?? null}
          icon={MapPinIcon}
        />
        <UsageCard
          label="Ürünler"
          used={products}
          limit={plan?.maxProducts ?? null}
          icon={PackageIcon}
        />
        <UsageCard
          label="Çalışanlar"
          used={staff}
          limit={plan?.maxStaff ?? null}
          icon={UsersIcon}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Paket bilgisi</CardTitle>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Paket</dt>
                  <dd className="font-medium">{subscription.plan.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Başlangıç</dt>
                  <dd className="font-medium">
                    {formatDate(subscription.startsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bitiş</dt>
                  <dd className="font-medium">
                    {formatDate(subscription.endsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Dil</dt>
                  <dd className="font-medium">
                    {subscription.plan.maxLanguages ?? "Sınırsız"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Geçerli bir aboneliğiniz yok.
              </p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Paket değişikliği için bizimle iletişime geçin.
            </p>
          </CardContent>
        </Card>

        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Hızlı işlemler</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link
                href="/panel/branches"
                className={buttonVariants({ variant: "outline" })}
              >
                <MapPinIcon />
                Şubeleri yönet
              </Link>
              <Link
                href="/panel/settings"
                className={buttonVariants({ variant: "outline" })}
              >
                <SettingsIcon />
                İşletme bilgileri
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
