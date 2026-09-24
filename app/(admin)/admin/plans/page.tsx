import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import {
  APPEARANCE_OPTIONS,
  STATS_OPTIONS,
  planFeaturesSchema,
} from "@/lib/validations/plan";

export const metadata: Metadata = { title: "Paketler" };

const limit = (n: number | null) => n ?? "Sınırsız";

export default async function PlansPage() {
  const plans = await db.plan.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <>
      <PageHeader
        title="Paketler"
        description="Limitler ve özellikler buradan yönetilir; koda gömülmez."
        actions={
          <Link href="/admin/plans/new" className={buttonVariants()}>
            <PlusIcon />
            Yeni paket
          </Link>
        }
      />
      <section className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paket</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Şube</TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>Çalışan</TableHead>
              <TableHead>Dil</TableHead>
              <TableHead>Görünüm</TableHead>
              <TableHead>İstatistik</TableHead>
              <TableHead>Abonelik</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => {
              const features = planFeaturesSchema.safeParse(plan.features).data;
              return (
                <TableRow key={plan.id}>
                  <TableCell>
                    <Link
                      href={`/admin/plans/${plan.id}`}
                      className="font-medium hover:underline"
                    >
                      {plan.name}
                    </Link>
                    {!plan.isActive && (
                      <Badge variant="secondary" className="ml-2">
                        Satışta değil
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatPrice(plan.price)}
                  </TableCell>
                  <TableCell>{limit(plan.maxBranches)}</TableCell>
                  <TableCell>{limit(plan.maxProducts)}</TableCell>
                  <TableCell>{limit(plan.maxStaff)}</TableCell>
                  <TableCell>{limit(plan.maxLanguages)}</TableCell>
                  <TableCell>
                    {features ? APPEARANCE_OPTIONS[features.appearance] : "—"}
                  </TableCell>
                  <TableCell>
                    {features ? STATS_OPTIONS[features.stats] : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {plan._count.subscriptions}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </>
  );
}
