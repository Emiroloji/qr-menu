import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { buildClientData } from "@/components/menu/client-data";
import { createMenuLabels } from "@/components/menu/labels";
import { MenuUnavailable } from "@/components/menu/menu-unavailable";
import { ThemedMenu } from "@/components/menu/themes";
import {
  getBusinessStatus,
  isBusinessOperational,
} from "@/lib/business-status";
import { isLanguageCode, pickLanguage } from "@/lib/languages";
import {
  getCachedMenuData,
  getMenuLookup,
  getMenuReference,
  withToday,
} from "@/lib/menu-data";
import { getMenuMessages } from "@/lib/menu-messages";
import { recordScan } from "@/lib/scan-log";

// Müşteri menüsünün ortak ekranı: /{işletme}/{şube} ve işletmenin kendi alan adı
// (app/(menu)/site, Faz 3.2) aynı kodu kullanır.

export async function menuMetadata(
  business: string,
  branch: string,
): Promise<Metadata> {
  const lookup = await getMenuLookup(business, branch);
  if (!lookup) return {};
  return {
    title: `${lookup.businessName} · ${lookup.branchName}`,
    description: `${lookup.businessName} menüsü`,
  };
}

/**
 * Müşteri menüsü (MIMARI §8). `path`: dil bağlantılarının adresi; platformda
 * /{işletme}/{şube}, işletmenin alan adında /{şube}.
 */
export async function MenuScreen({
  business,
  branch,
  lang: requested,
  path,
}: {
  business: string;
  branch: string;
  lang: string | null;
  path: string;
}) {
  const requestHeaders = await headers();
  const lookup = await getMenuLookup(business, branch);
  if (!lookup) notFound();

  const lang = pickLanguage(
    requested,
    lookup.languages,
    requestHeaders.get("accept-language"),
  );
  const messages = getMenuMessages(lang);

  const status = getBusinessStatus({
    isActive: lookup.isActive,
    subscriptions: lookup.subscriptions.map((s) => ({
      ...s,
      startsAt: new Date(s.startsAt),
      endsAt: new Date(s.endsAt),
    })),
  });
  if (!isBusinessOperational(status)) {
    return (
      <MenuUnavailable
        lang={lang}
        messages={messages}
        english={lang === "en" ? null : getMenuMessages("en")}
      />
    );
  }

  const [cached, reference] = await Promise.all([
    getCachedMenuData(lookup.branchId, lang),
    getMenuReference(lang),
  ]);
  if (!cached) notFound();
  const data = withToday(cached);
  const labels = createMenuLabels(lang, messages);
  const client = buildClientData(data, labels, messages, {
    ...reference,
    languages: lookup.languages.filter(isLanguageCode),
    path,
    branchId: lookup.branchId,
  });

  // Tarama kaydı yanıttan sonra yazılır; menüyü yavaşlatmaz. Dil değiştirme (?lang) sayılmaz.
  if (!requested) {
    const userAgent = requestHeaders.get("user-agent") ?? "";
    after(() => recordScan(lookup.branchId, lang, userAgent));
  }

  return (
    <ThemedMenu data={data} labels={labels} client={client} scope="menu" />
  );
}
