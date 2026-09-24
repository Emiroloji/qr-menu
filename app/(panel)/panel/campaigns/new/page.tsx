import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { CampaignForm } from "../campaign-form";
import { translationLanguages } from "../data";

export const metadata: Metadata = { title: "Yeni kampanya" };

export default async function NewCampaignPage({
  searchParams,
}: PageProps<"/panel/campaigns/new">) {
  const { user, businessId } = await requireSession();
  if (!hasPermission(user, "CAMPAIGN_EDIT")) redirect("/panel");
  const { branch: branchId } = await searchParams;
  if (typeof branchId !== "string") redirect("/panel/campaigns");

  // İşletme izolasyonu: şube bu işletmenin olmalı.
  const branch = await db.branch.findFirst({
    where: { id: branchId, businessId, deletedAt: null },
    select: { id: true, name: true, languages: true },
  });
  if (!branch) notFound();

  const now = new Date().getTime();
  return (
    <>
      <PageHeader
        title="Yeni kampanya"
        description={`${branch.name} şubesinin menüsünde görünecek.`}
      />
      <CampaignForm
        branchId={branch.id}
        languages={translationLanguages(branch.languages)}
        defaultDates={{
          startsAt: toDateInputValue(new Date(now)),
          endsAt: toDateInputValue(new Date(now + 6 * 24 * 60 * 60 * 1000)),
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Görsel</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Görsel eklemek için önce kampanyayı kaydedin.
        </CardContent>
      </Card>
    </>
  );
}
