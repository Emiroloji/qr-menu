import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { BranchForm } from "../branch-form";

export const metadata: Metadata = { title: "Yeni şube" };

export default async function NewBranchPage() {
  const { businessId } = await requireOwnerSession();
  const { business, subscription } = await getBusinessContext(businessId);
  return (
    <>
      <PageHeader title="Yeni şube" />
      <BranchForm
        businessSlug={business.slug}
        maxLanguages={subscription?.plan.maxLanguages ?? 1}
      />
    </>
  );
}
