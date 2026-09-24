import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { PERMISSION_LABELS } from "@/lib/permissions";
import { isWithinLimit } from "@/lib/plan-limits";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";

export const metadata: Metadata = { title: "Çalışanlar" };

export default async function StaffPage() {
  const { businessId } = await requireOwnerSession();
  const [{ subscription }, staff] = await Promise.all([
    getBusinessContext(businessId),
    db.user.findMany({
      where: { businessId, role: "STAFF" },
      orderBy: { createdAt: "asc" },
      include: {
        permissions: true,
        _count: {
          select: { accounts: { where: { providerId: "credential" } } },
        },
      },
    }),
  ]);
  const limit = subscription?.plan.maxStaff ?? null;
  const canAdd =
    subscription !== null && isWithinLimit(limit, staff.length + 1);

  return (
    <>
      <PageHeader
        title="Çalışanlar"
        description={`Çalışanlarınız kendi hesaplarıyla girer ve yalnızca izin verdiğiniz işleri yapar. ${staff.length} / ${limit ?? "sınırsız"} çalışan.`}
        actions={
          canAdd ? (
            <Link href="/panel/staff/new" className={buttonVariants()}>
              <PlusIcon />
              Çalışan ekle
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">
              Çalışan limitine ulaştınız. Daha fazlası için paketinizi
              yükseltin.
            </span>
          )
        }
      />
      {staff.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <UsersIcon className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-medium">Henüz çalışan eklenmedi</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Örneğin garsonlarınıza yalnızca biten ürünleri “Tükendi” yapma
              yetkisi verebilirsiniz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Çalışan</TableHead>
                <TableHead>Yetkiler</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/panel/staff/${member.id}`}
                      className="flex flex-col font-medium hover:underline"
                    >
                      {member.name}
                      <span className="text-xs font-normal text-muted-foreground">
                        {member.email}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Yetki yok
                        </span>
                      ) : (
                        member.permissions.map((p) => (
                          <Badge key={p.permission} variant="outline">
                            {PERMISSION_LABELS[p.permission].label}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {member._count.accounts === 0 ? (
                      <Badge variant="secondary">Şifre belirlemedi</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Aktif
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </>
  );
}
