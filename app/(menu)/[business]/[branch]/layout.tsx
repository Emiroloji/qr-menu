import { notFound } from "next/navigation";
import { getMenuLookup } from "@/lib/menu-data";

// Adres kontrolü yükleme ekranından (loading.tsx) önce yapılır; böylece olmayan menü
// gerçekten 404 durum koduyla döner. Sorgu önbellekli olduğu için sayfada tekrarı ucuzdur.
export default async function MenuLayout({
  children,
  params,
}: LayoutProps<"/[business]/[branch]">) {
  const { business, branch } = await params;
  if (!(await getMenuLookup(business, branch))) notFound();
  return children;
}
