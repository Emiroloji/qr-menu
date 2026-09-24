import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { requireOwnerSession } from "@/lib/session";
import { StaffForm } from "../staff-form";

export const metadata: Metadata = { title: "Çalışan" };

export default async function StaffMemberPage({
  params,
}: PageProps<"/panel/staff/[id]">) {
  const { businessId } = await requireOwnerSession();
  const { id } = await params;
  // İşletme izolasyonu: yalnızca bu işletmenin çalışanı.
  const staff = await db.user.findFirst({
    where: { id, businessId, role: "STAFF" },
    include: {
      permissions: true,
      _count: { select: { accounts: { where: { providerId: "credential" } } } },
    },
  });
  if (!staff) notFound();

  return (
    <>
      <Link
        href="/panel/staff"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Çalışanlar
      </Link>
      <PageHeader title={staff.name} description={staff.email} />
      <StaffForm
        key={staff.updatedAt.toISOString()}
        staff={{
          id: staff.id,
          name: staff.name,
          email: staff.email,
          permissions: staff.permissions.map((p) => p.permission),
          hasPassword: staff._count.accounts > 0,
        }}
      />
    </>
  );
}
