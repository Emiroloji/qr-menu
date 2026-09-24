import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import { BusinessForm } from "./business-form";

export const metadata: Metadata = { title: "Yeni işletme" };

export default async function NewBusinessPage() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);

  return (
    <>
      <PageHeader
        title="Yeni işletme"
        description="İşletme sahibine şifresini belirlemesi için bir e-posta gönderilir."
      />
      <BusinessForm
        plans={plans}
        defaultStartsAt={toDateInputValue(today)}
        defaultEndsAt={toDateInputValue(nextYear)}
      />
    </>
  );
}
