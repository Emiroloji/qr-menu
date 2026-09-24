import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/panel/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { getProductFormOptions } from "../data";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Yeni ürün" };

export default async function NewProductPage({
  searchParams,
}: PageProps<"/panel/menu/products/new">) {
  const { user, businessId } = await requireSession();
  if (!hasPermission(user, "PRODUCT_EDIT")) redirect("/panel/menu");
  const { category: categoryId } = await searchParams;
  if (typeof categoryId !== "string") redirect("/panel/menu");

  // İşletme izolasyonu: kategori bu işletmenin olmalı.
  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      deletedAt: null,
      branch: { businessId, deletedAt: null },
    },
    select: { id: true, branchId: true, name: true },
  });
  if (!category) notFound();
  const options = await getProductFormOptions(category.branchId);

  return (
    <>
      <PageHeader
        title="Yeni ürün"
        description={`${category.name} kategorisine eklenecek.`}
      />
      <ProductForm
        defaultCategoryId={category.id}
        {...options}
        imagesSlot={
          <Card>
            <CardHeader>
              <CardTitle>Görseller</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Görsel eklemek için önce ürünü kaydedin.
            </CardContent>
          </Card>
        }
      />
    </>
  );
}
