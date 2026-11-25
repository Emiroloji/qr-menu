import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { PlanForm } from "../plan-form";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Yeni paket" };

export default async function NewPlanPage() {
  // Yetki her sayfada ayrıca denetlenir: layout istemci gezintisinde atlanabilir.
  await requireRole("SUPER_ADMIN");
  return (
    <>
      <PageHeader title="Yeni paket" />
      <PlanForm />
    </>
  );
}
