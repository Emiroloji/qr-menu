import type { Metadata } from "next";
import { MenuScreen, menuMetadata } from "../../menu-screen";

type Props = PageProps<"/[business]/[branch]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { business, branch } = await params;
  return menuMetadata(business, branch);
}

/** Müşteri menüsü (MIMARI §8): /{işletme}/{şube}?lang=xx */
export default async function MenuPage({ params, searchParams }: Props) {
  const [{ business, branch }, search] = await Promise.all([
    params,
    searchParams,
  ]);
  return (
    <MenuScreen
      business={business}
      branch={branch}
      lang={typeof search.lang === "string" ? search.lang : null}
      path={`/${business}/${branch}`}
    />
  );
}
