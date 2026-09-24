import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import { getProductFormOptions } from "../data";
import { ProductForm } from "../product-form";
import { ProductImages } from "../product-images";

export const metadata: Metadata = { title: "Ürün" };

export default async function ProductPage({
  params,
}: PageProps<"/panel/menu/products/[id]">) {
  const { user, businessId } = await requireSession();
  if (!hasPermission(user, "PRODUCT_EDIT")) redirect("/panel/menu");
  const { id } = await params;

  // İşletme izolasyonu: başka işletmenin ürünü bulunamaz.
  const product = await db.product.findFirst({
    where: {
      id,
      deletedAt: null,
      category: { deletedAt: null, branch: { businessId, deletedAt: null } },
    },
    include: {
      category: { select: { branchId: true, name: true } },
      variants: { orderBy: { sortOrder: "asc" } },
      allergens: true,
      tags: true,
      nutrition: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) notFound();
  const options = await getProductFormOptions(product.category.branchId);

  return (
    <>
      <Link
        href={`/panel/menu?branch=${product.category.branchId}&category=${product.categoryId}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {product.category.name}
      </Link>
      <PageHeader title={product.name} />
      <ProductForm
        key={product.updatedAt.toISOString()}
        defaultCategoryId={product.categoryId}
        {...options}
        product={{
          ...product,
          tagIds: product.tags.map((t) => t.tagId),
          allergens: Object.fromEntries(
            product.allergens.map((a) => [a.allergenId, a.level]),
          ),
          variants: product.variants,
          nutrition: {
            calories: product.nutrition?.calories ?? null,
            protein: product.nutrition?.protein ?? null,
            carbs: product.nutrition?.carbs ?? null,
            fat: product.nutrition?.fat ?? null,
            sugar: product.nutrition?.sugar ?? null,
            salt: product.nutrition?.salt ?? null,
          },
        }}
        imagesSlot={
          <ProductImages
            productId={product.id}
            productName={product.name}
            images={product.images}
          />
        }
      />
    </>
  );
}
