import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBusinessStatus,
  getCurrentSubscription,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { formatDate, toDateInputValue } from "@/lib/format";
import { StatusBadge } from "../../_components/status-badge";
import {
  BusinessActiveButton,
  ExtendSubscriptionForm,
  SendLoginLinkButton,
  StartSubscriptionForm,
  SubscriptionStatusButton,
} from "./business-actions";

export const metadata: Metadata = { title: "İşletme" };

const SUBSCRIPTION_STATUS_LABELS = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıda",
  EXPIRED: "Sona erdi",
};

export default async function BusinessPage({
  params,
}: PageProps<"/admin/businesses/[id]">) {
  const { id } = await params;
  const [business, plans] = await Promise.all([
    db.business.findUnique({
      where: { id, deletedAt: null },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { startsAt: "desc" },
        },
        users: {
          where: { role: "OWNER" },
          include: {
            _count: {
              select: { accounts: { where: { providerId: "credential" } } },
            },
          },
        },
        _count: { select: { branches: { where: { deletedAt: null } } } },
      },
    }),
    db.plan.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!business) notFound();

  const status = getBusinessStatus(business);
  const current = getCurrentSubscription(business.subscriptions);
  const owner = business.users[0];
  const now = new Date();
  // Yeni abonelik varsayılanı: mevcut bitişin ertesi günü veya bugün, 1 yıl.
  const nextStart = current ? new Date(current.endsAt.getTime() + 1) : now;
  const nextEnd = new Date(nextStart);
  nextEnd.setFullYear(nextStart.getFullYear() + 1);

  return (
    <>
      <Link
        href="/admin/businesses"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        İşletmeler
      </Link>
      <PageHeader
        title={business.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">/{business.slug}</span>
            <StatusBadge status={status} />
          </span>
        }
        actions={
          <BusinessActiveButton
            businessId={business.id}
            isActive={business.isActive}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>İşletme sahibi</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {owner ? (
              <>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">{owner.name}</span>
                  <span className="text-muted-foreground">{owner.email}</span>
                  {owner._count.accounts === 0 && (
                    <Badge variant="secondary" className="mt-1 w-fit">
                      Henüz şifresini belirlemedi
                    </Badge>
                  )}
                </div>
                <div>
                  <SendLoginLinkButton businessId={business.id} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sahip hesabı yok.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geçerli abonelik</CardTitle>
            {!current && (
              <CardDescription>
                Geçerli abonelik yok; menü yayında değil.
              </CardDescription>
            )}
          </CardHeader>
          {current && (
            <CardContent className="flex flex-col gap-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Paket</dt>
                  <dd className="font-medium">{current.plan.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Şube</dt>
                  <dd className="font-medium tabular-nums">
                    {business._count.branches} /{" "}
                    {current.plan.maxBranches ?? "∞"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Başlangıç</dt>
                  <dd className="font-medium">
                    {formatDate(current.startsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bitiş</dt>
                  <dd className="font-medium">{formatDate(current.endsAt)}</dd>
                </div>
              </dl>
              <ExtendSubscriptionForm
                key={current.endsAt.toISOString()}
                subscriptionId={current.id}
                defaultEndsAt={toDateInputValue(nextEnd)}
              />
              <div>
                <SubscriptionStatusButton
                  subscriptionId={current.id}
                  suspended={current.status === "SUSPENDED"}
                />
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni abonelik başlat</CardTitle>
          <CardDescription>
            Paket değişikliği veya yenileme için kullanılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StartSubscriptionForm
            key={nextStart.toISOString()}
            businessId={business.id}
            plans={plans}
            defaultStartsAt={toDateInputValue(nextStart)}
            defaultEndsAt={toDateInputValue(nextEnd)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonelik geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {business.subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.plan.name}
                    {s.id === current?.id && (
                      <Badge variant="outline" className="ml-2">
                        Geçerli
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(s.startsAt)}</TableCell>
                  <TableCell>{formatDate(s.endsAt)}</TableCell>
                  <TableCell>
                    {s.endsAt < now
                      ? "Süresi doldu"
                      : SUBSCRIPTION_STATUS_LABELS[s.status]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
