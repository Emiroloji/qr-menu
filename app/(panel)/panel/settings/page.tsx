import type { Metadata } from "next";
import { removeLogo } from "@/actions/business";
import { ImageUploader } from "@/components/panel/image-uploader";
import { PageHeader } from "@/components/panel/page-header";
import { platformHost } from "@/lib/custom-domain";
import {
  canUseBranding,
  canUseCustomDomain,
  readPlanFeatures,
} from "@/lib/plan-features";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { CustomDomainCard } from "./custom-domain-card";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "İşletme bilgileri" };

export default async function SettingsPage() {
  const { businessId } = await requireOwnerSession();
  const { business, subscription } = await getBusinessContext(businessId);
  const features = readPlanFeatures(subscription?.plan.features);
  const branding = canUseBranding(features);
  // Platform alan adıyla çalışıyorsa CNAME, IP adresiyle çalışıyorsa A kaydı.
  const host = platformHost();
  const dns = /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
    ? { type: "A" as const, value: host }
    : { type: "CNAME" as const, value: host };

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
        <CustomDomainCard
          key={`${business.customDomain}:${Boolean(business.customDomainVerifiedAt)}`}
          domain={business.customDomain}
          verified={Boolean(business.customDomainVerifiedAt)}
          allowed={canUseCustomDomain(features)}
          dns={dns}
        />
      </div>
    </>
  );
}
