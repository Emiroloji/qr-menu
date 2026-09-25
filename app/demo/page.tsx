import type { Metadata } from "next";
import Link from "next/link";
import { buildClientData } from "@/components/menu/client-data";
import { createMenuLabels } from "@/components/menu/labels";
import { ThemedMenu } from "@/components/menu/themes";
import { DEMO_THEMES, demoMenu } from "@/lib/demo-menu";
import { getMenuReference, withToday } from "@/lib/menu-data";
import { getMenuMessages } from "@/lib/menu-messages";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Örnek menü",
  description:
    "QR Menü ile hazırlanmış örnek bir kafe menüsü. Dört temayı deneyin.",
};

/** Örnek menü (FAZLAR 3.4). Hayali işletme; kayıt tutulmaz. `?tema=luxury` */
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { tema } = await searchParams;
  const theme =
    DEMO_THEMES.find((t) => t.code === tema)?.code ?? DEMO_THEMES[0].code;

  const data = withToday(demoMenu(theme));
  const messages = getMenuMessages("tr");
  const labels = createMenuLabels("tr", messages);
  const client = buildClientData(data, labels, messages, {
    ...(await getMenuReference("tr")),
    languages: ["tr"],
    path: `/demo?tema=${theme}`,
    branchId: null,
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <nav
        aria-label="Örnek menü teması"
        className="flex items-center gap-3 overflow-x-auto bg-site-ink px-4 py-2 text-sm text-white"
      >
        <span className="shrink-0 text-white/70">Örnek menü · Tema</span>
        <div className="flex gap-1">
          {DEMO_THEMES.map((t) => (
            <Link
              key={t.code}
              href={`/demo?tema=${t.code}`}
              replace
              scroll={false}
              aria-current={t.code === theme ? "true" : undefined}
              className={cn(
                "flex h-8 shrink-0 items-center rounded-full px-3 text-white/80 hover:text-white",
                t.code === theme &&
                  "bg-white font-medium text-site-ink hover:text-site-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <ThemedMenu data={data} labels={labels} client={client} scope="demo" />
    </div>
  );
}
