import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { removeCampaignImage } from "@/actions/campaign";
import { ImageUploader } from "@/components/panel/image-uploader";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { toDateInputValue } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { productImageSrc } from "@/lib/product-image";
import { requireSession } from "@/lib/session";
import { readTranslations } from "@/lib/translations";
import { CampaignForm } from "../campaign-form";
import { translationLanguages } from "../data";

export const metadata: Metadata = { title: "Kampanyayı düzenle" };

export default async function EditCampaignPage({
  params,
}: PageProps<"/panel/campaigns/[id]">) {
  const { user, businessId } = await requireSession();
  if (!hasPermission(user, "CAMPAIGN_EDIT")) redirect("/panel");
  const { id } = await params;

  // İşletme izolasyonu: kampanya bu işletmenin şubesine ait olmalı.
  const campaign = await db.campaign.findFirst({
    where: { id, branch: { businessId, deletedAt: null } },
    include: { branch: { select: { name: true, languages: true } } },
  });
  if (!campaign) notFound();

  return (
    <>
      <PageHeader
        title={campaign.title}
        description={`${campaign.branch.name} şubesi`}
      />
      <CampaignForm
        branchId={campaign.branchId}
        languages={translationLanguages(campaign.branch.languages)}
        defaultDates={{ startsAt: "", endsAt: "" }}
        campaign={{
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          startsAt: toDateInputValue(campaign.startsAt),
          endsAt: toDateInputValue(campaign.endsAt),
          isActive: campaign.isActive,
          translations: readTranslations(campaign.translations),
        }}
      />
      <ImageUploader
        kind="campaign"
        params={`campaignId=${campaign.id}`}
        title="Kampanya görseli"
        description="Yatay bir görsel seçin (2:1 oranında kırpılarak gösterilir). JPEG, PNG veya WebP; en fazla 10 MB."
        imageUrl={
          campaign.imageUrl ? productImageSrc(campaign.imageUrl, 800) : null
        }
        alt={campaign.title}
        wide
        onRemove={removeCampaignImage.bind(null, campaign.id)}
      />
    </>
  );
}
