import type { Metadata } from "next";
import { removeLogo } from "@/actions/business";
import { ImageUploader } from "@/components/panel/image-uploader";
import { PageHeader } from "@/components/panel/page-header";
import { canUseBranding, readPlanFeatures } from "@/lib/plan-features";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "İşletme bilgileri" };

export default async function SettingsPage() {
  const { businessId } = await requireOwnerSession();
  const { business, subscription } = await getBusinessContext(businessId);
  const branding = canUseBranding(
    readPlanFeatures(subscription?.plan.features),
  );

  return (
    <>
      <PageHeader
        title="İşletme bilgileri"
        description="Adınız ve logonuz tüm şubelerin menüsünde görünür."
      />
      <div className="grid max-w-3xl gap-6">
        <SettingsForm
          key={business.name}
          name={business.name}
          slug={business.slug}
        />
        <ImageUploader
          kind="logo"
          title="Logo"
          description="JPEG, PNG veya WebP · en fazla 10 MB. Kare logolar en iyi görünür."
          imageUrl={business.logoUrl}
          alt={`${business.name} logosu`}
          unavailableMessage={
            branding
              ? undefined
              : "Logo, Standart ve üzeri paketlerde kullanılabilir. Paket yükseltmek için bizimle iletişime geçin."
          }
          onRemove={removeLogo}
        />
      </div>
    </>
  );
}
