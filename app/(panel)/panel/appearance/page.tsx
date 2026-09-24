import type { Metadata } from "next";
import { removeCover } from "@/actions/appearance";
import type { MenuData } from "@/components/menu/types";
import { ImageUploader } from "@/components/panel/image-uploader";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { buildClientData } from "@/components/menu/client-data";
import { createMenuLabels } from "@/components/menu/labels";
import { getMenuData, getMenuReference, withToday } from "@/lib/menu-data";
import { getMenuMessages } from "@/lib/menu-messages";
import { effectiveAppearance } from "@/lib/menu-themes";
import {
  canUseBranding,
  canUseCover,
  readPlanFeatures,
} from "@/lib/plan-features";
import { getBusinessContext, requireOwnerSession } from "@/lib/session";
import { AppearanceEditor } from "./appearance-editor";

export const metadata: Metadata = { title: "Görünüm" };

export default async function AppearancePage() {
  const { businessId } = await requireOwnerSession();
  const { business, subscription } = await getBusinessContext(businessId);
  const features = readPlanFeatures(subscription?.plan.features);
  const appearance = effectiveAppearance(business, features);

  // Önizleme: ilk şubenin gerçek menüsü; şube yoksa örnek veri.
  const branch = await db.branch.findFirst({
    where: { businessId, deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  const found = (branch && (await getMenuData(branch.id, "tr"))) || {
    lang: "tr",
    appearance,
    business: { name: business.name },
    branch: {
      name: "Şube",
      address: null,
      phone: null,
      wifi: null,
      socials: {},
      openingHours: {},
      todayHours: "09:00–22:00",
    },
    categories: [
      {
        id: "ornek",
        name: "Örnek kategori",
        description: null,
        products: [
          {
            id: "ornek-urun",
            name: "Örnek ürün",
            description:
              "Menünüze ürün ekledikçe önizleme gerçek içerikle dolar.",
            image: null,
            variants: [{ name: null, price: 10000 }],
            badges: ["NEW"],
            isAvailable: true,
            spiceLevel: 0,
            allergens: [],
            tags: [],
            ingredients: null,
            portion: null,
            prepTime: null,
            origin: null,
            nutrition: null,
          },
        ],
      },
    ],
    campaigns: [],
    dailySpecials: [],
    dailyProductId: null,
    featuredIds: [],
  };

  const preview: MenuData = withToday(found);
  const messages = getMenuMessages("tr");
  const client = buildClientData(
    preview,
    createMenuLabels("tr", messages),
    messages,
    {
      ...(await getMenuReference("tr")),
      languages: ["tr"],
      path: "#",
      branchId: null,
    },
  );

  return (
    <>
      <PageHeader
        title="Görünüm"
        description="Menünüzün temasını ve rengini seçin. Önizleme değişiklikleri anında gösterir; kaydedince menünüz güncellenir."
      />
      <AppearanceEditor
        preview={{ ...preview, appearance }}
        client={client}
        messages={messages}
        savedTheme={appearance.theme}
        savedColor={business.primaryColor}
        branding={canUseBranding(features)}
      >
        <ImageUploader
          kind="cover"
          title="Kapak görseli"
          description="Menünün üstünde geniş görsel (Sıcak temada görünür). JPEG, PNG veya WebP · en fazla 10 MB · yatay görseller en iyi sonucu verir."
          imageUrl={business.coverUrl}
          alt="Kapak görseli"
          wide
          unavailableMessage={
            canUseCover(features)
              ? undefined
              : "Kapak görseli Pro pakette kullanılabilir. Paket yükseltmek için bizimle iletişime geçin."
          }
          onRemove={removeCover}
        />
      </AppearanceEditor>
    </>
  );
}
