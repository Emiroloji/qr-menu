import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenIcon, ClockIcon, LanguagesIcon, PlusIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { hasAnyMenuPermission, hasPermission } from "@/lib/permissions";
import { isLanguageCode } from "@/lib/languages";
import { formatServiceHours } from "@/lib/service-hours";
import { requireSession } from "@/lib/session";
import { isProductMissing, missingFields } from "@/lib/translations";
import { BranchSwitcher } from "./_components/branch-switcher";
import { BulkPriceDialog } from "./_components/bulk-price-dialog";
import { CategoryActions } from "./_components/category-actions";
import { CategoryPanel } from "./_components/category-panel";
import { CopyMenuDialog } from "./_components/copy-menu-dialog";
import { ProductList } from "./_components/product-list";

export const metadata: Metadata = { title: "Menü" };

export default async function MenuPage({
  searchParams,
}: PageProps<"/panel/menu">) {
  const { user, businessId } = await requireSession();
  if (!hasAnyMenuPermission(user)) redirect("/panel");
  const can = {
    editCategory: hasPermission(user, "CATEGORY_EDIT"),
    editProduct: hasPermission(user, "PRODUCT_EDIT"),
    toggle: hasPermission(user, "PRODUCT_TOGGLE_AVAILABILITY"),
    editPrice: hasPermission(user, "PRODUCT_EDIT_PRICE"),
    owner: user.role === "OWNER",
  };

  const params = await searchParams;
  const branches = await db.branch.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true, name: true, languages: true },
    orderBy: { createdAt: "asc" },
  });
  if (branches.length === 0) {
    return (
      <>
        <PageHeader title="Menü" />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <BookOpenIcon
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">
              Menü oluşturmak için önce bir şube ekleyin.
            </p>
            {can.owner && (
              <Link href="/panel/branches/new" className={buttonVariants()}>
                Şube ekle
              </Link>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  const branch = branches.find((b) => b.id === params.branch) ?? branches[0];
  const categories = await db.category.findMany({
    where: { branchId: branch.id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });
  const category =
    categories.find((c) => c.id === params.category) ?? categories[0] ?? null;
  const products = category
    ? await db.product.findMany({
        where: { categoryId: category.id, deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          variants: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, name: true, price: true },
          },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      })
    : [];

  // Çevirisi eksik kayıt sayısı (şubenin Türkçe dışındaki tüm dilleri).
  const foreign = branch.languages.filter(
    (l) => isLanguageCode(l) && l !== "tr",
  );
  const canTranslate = can.editCategory || can.editProduct;
  let missingTranslations = 0;
  if (canTranslate && foreign.length > 0) {
    const all = await db.product.findMany({
      where: {
        deletedAt: null,
        category: { branchId: branch.id, deletedAt: null },
      },
      select: {
        name: true,
        description: true,
        translations: true,
        variants: { select: { name: true, translations: true } },
      },
    });
    for (const l of foreign) {
      if (!isLanguageCode(l)) continue;
      if (can.editProduct)
        missingTranslations += all.filter((p) => isProductMissing(p, l)).length;
      if (can.editCategory)
        missingTranslations += categories.filter(
          (c) => missingFields(c, l).length > 0,
        ).length;
    }
  }

  return (
    <>
      <PageHeader
        title="Menü"
        description={
          can.editCategory || can.editProduct
            ? "Kategorileri ve ürünleri sürükleyerek sıralayabilirsiniz. Değişiklikler menüde hemen görünür."
            : "Biten ürünleri “Tükendi” olarak işaretleyebilirsiniz. Değişiklikler menüde hemen görünür."
        }
        actions={
          <>
            {branches.length > 1 && (
              <BranchSwitcher branches={branches} value={branch.id} />
            )}
            {canTranslate && foreign.length > 0 && (
              <Link
                href={`/panel/menu/translations?branch=${branch.id}${missingTranslations ? "&missing=1" : ""}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <LanguagesIcon />
                Çeviriler
                {missingTranslations > 0 && (
                  <Badge variant="secondary" className="tabular-nums">
                    {missingTranslations} eksik
                  </Badge>
                )}
              </Link>
            )}
            {can.editPrice && (
              <BulkPriceDialog
                branchId={branch.id}
                category={category && { id: category.id, name: category.name }}
                samplePrice={products[0]?.variants[0]?.price ?? null}
              />
            )}
            {can.owner && branches.length > 1 && (
              <CopyMenuDialog
                from={branch}
                targets={branches.filter((b) => b.id !== branch.id)}
              />
            )}
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <CategoryPanel
          branchId={branch.id}
          selectedId={category?.id ?? null}
          canEdit={can.editCategory}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            isVisible: c.isVisible,
            hours:
              c.availableFrom && c.availableTo
                ? formatServiceHours({
                    from: c.availableFrom,
                    to: c.availableTo,
                  })
                : null,
            productCount: c._count.products,
          }))}
        />

        <section
          aria-label="Ürünler"
          className="flex flex-col rounded-xl border bg-background"
        >
          {category ? (
            <>
              <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    {category.name}
                    {!category.isVisible && (
                      <Badge variant="secondary">Gizli</Badge>
                    )}
                    {category.availableFrom && category.availableTo && (
                      <Badge variant="outline">
                        <ClockIcon />
                        {formatServiceHours({
                          from: category.availableFrom,
                          to: category.availableTo,
                        })}
                      </Badge>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {products.length} ürün
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {can.editCategory && (
                    <CategoryActions
                      branchId={branch.id}
                      productCount={products.length}
                      category={{
                        id: category.id,
                        name: category.name,
                        description: category.description,
                        isVisible: category.isVisible,
                        availableFrom: category.availableFrom,
                        availableTo: category.availableTo,
                      }}
                    />
                  )}
                  {can.editProduct && (
                    <Link
                      href={`/panel/menu/products/new?category=${category.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      <PlusIcon />
                      Ürün ekle
                    </Link>
                  )}
                </div>
              </div>
              {products.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  Bu kategoride henüz ürün yok.
                </p>
              ) : (
                <ProductList
                  categoryId={category.id}
                  permissions={{
                    edit: can.editProduct,
                    toggle: can.toggle,
                    price: can.editPrice,
                  }}
                  products={products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    isAvailable: p.isAvailable,
                    isVisible: p.isVisible,
                    badges: p.badges,
                    variants: p.variants,
                    image: p.images[0] ?? null,
                  }))}
                />
              )}
            </>
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">
              {can.editCategory
                ? "Başlamak için soldan bir kategori ekleyin (ör. Kahveler, Tatlılar)."
                : "Bu şubede henüz kategori yok."}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
