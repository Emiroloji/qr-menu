import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/panel/page-header";
import { countUsage, getActivePlan, isWithinLimit } from "@/lib/plan-limits";
import { requireOwnerSession } from "@/lib/session";
import { StaffForm } from "../staff-form";

export const metadata: Metadata = { title: "Yeni çalışan" };

export default async function NewStaffPage() {
  const { businessId } = await requireOwnerSession();
  const [plan, count] = await Promise.all([
    getActivePlan(businessId),
    countUsage(businessId, "staff"),
  ]);
  if (!plan || !isWithinLimit(plan.maxStaff, count + 1))
    redirect("/panel/staff");
  return (
    <>
      <PageHeader title="Yeni çalışan" />
      <StaffForm />
    </>
  );
}
