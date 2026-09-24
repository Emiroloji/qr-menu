import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { LogoUploader } from "./logo-uploader";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "İşletme bilgileri" };

export default async function SettingsPage() {
  const { businessId } = await requireOwnerSession();
  const { business } = await getBusinessContext(businessId);

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
        <LogoUploader name={business.name} logoUrl={business.logoUrl} />
      </div>
    </>
  );
}
