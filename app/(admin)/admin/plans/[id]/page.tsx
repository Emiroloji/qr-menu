import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { planFeaturesSchema } from "@/lib/validations/plan";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Paketi düzenle" };

export default async function EditPlanPage({
  params,
}: PageProps<"/admin/plans/[id]">) {
  const { id } = await params;
  const plan = await db.plan.findUnique({ where: { id } });
  if (!plan) notFound();

  return (
    <>
      <PageHeader
        title={plan.name}
        description="Değişiklikler bu paketi kullanan tüm işletmelere hemen yansır."
      />
      <PlanForm
        plan={{
          ...plan,
          // Kuruş → "1499,90"
          price: (plan.price / 100).toFixed(2).replace(".", ","),
          features: planFeaturesSchema.parse(plan.features),
        }}
      />
    </>
  );
}
