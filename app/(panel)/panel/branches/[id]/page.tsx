import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import type { OpeningHours, Socials } from "@/lib/validations/branch";
import { BranchForm } from "../branch-form";

export const metadata: Metadata = { title: "Şube" };

export default async function BranchPage({
  params,
}: PageProps<"/panel/branches/[id]">) {
  const { businessId } = await requireOwnerSession();
  const { id } = await params;
  const [{ business, subscription }, branch] = await Promise.all([
    getBusinessContext(businessId),
    // İşletme izolasyonu: başka işletmenin şubesi bulunamaz.
    db.branch.findFirst({ where: { id, businessId, deletedAt: null } }),
  ]);
  if (!branch) notFound();

  return (
    <>
      <Link
        href="/panel/branches"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Şubeler
      </Link>
      <PageHeader
        title={branch.name}
        description={
          <span className="font-mono">
            /{business.slug}/{branch.slug}
          </span>
        }
      />
      <BranchForm
        key={branch.updatedAt.toISOString()}
        businessSlug={business.slug}
        maxLanguages={subscription?.plan.maxLanguages ?? 1}
        branch={{
          ...branch,
          openingHours: branch.openingHours as OpeningHours,
          socials: branch.socials as Socials,
        }}
      />
    </>
  );
}
