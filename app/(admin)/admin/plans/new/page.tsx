import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { PlanForm } from "../plan-form";

export const metadata: Metadata = { title: "Yeni paket" };

export default function NewPlanPage() {
  return (
    <>
      <PageHeader title="Yeni paket" />
      <PlanForm />
    </>
  );
}
