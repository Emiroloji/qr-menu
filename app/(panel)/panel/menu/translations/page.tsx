import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, CheckCircle2Icon, LanguagesIcon } from "lucide-react";
import { PageHeader } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import {
  getLanguage,
  isLanguageCode,
  type LanguageCode,
} from "@/lib/languages";
import { hasPermission } from "@/lib/permissions";
import { requireSession } from "@/lib/session";
import {
  isProductMissing,
  missingFields,
  readTranslations,
} from "@/lib/translations";
import { cn } from "@/lib/utils";
import { BranchSwitcher } from "../_components/branch-switcher";
import { TranslationForm } from "./translation-form";

export const metadata: Metadata = { title: "Çeviriler" };

/** Türkçe kaynak metin ve altında çeviri alanı. */
function TranslationField({
  name,
  source,
  value,
  lang,
  multiline,
  label,
}: {
  name: string;
  source: string;
  value: string | undefined;
  lang: LanguageCode;
  multiline?: boolean;
  label: string;
}) {
  const { dir } = getLanguage(lang);
  const missing = !value?.trim();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="flex flex-col gap-0.5 text-sm">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span lang="tr" className="font-medium">
          {source}
        </span>
      </label>
      {multiline ? (
        <Textarea
          id={name}
          name={name}
          rows={2}
          lang={lang}
          dir={dir}
          defaultValue={value}
          className={cn(missing && "border-amber-400")}
        />
      ) : (
        <Input
          id={name}
          name={name}
          lang={lang}
          dir={dir}
          defaultValue={value}
          className={cn(missing && "border-amber-400")}
        />
      )}
    </div>
  );
}

export default async function TranslationsPage({
  searchParams,
}: PageProps<"/panel/menu/translations">) {
  const { user, businessId } = await requireSession();
  const canCategory = hasPermission(user, "CATEGORY_EDIT");
  const canProduct = hasPermission(user, "PRODUCT_EDIT");
  if (!canCategory && !canProduct) redirect("/panel/menu");

  const params = await searchParams;
  const branches = await db.branch.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true, name: true, languages: true },
    orderBy: { createdAt: "asc" },
  });
  const branch = branches.find((b) => b.id === params.branch) ?? branches[0];
  if (!branch) redirect("/panel/menu");

  const languages = branch.languages.filter(
    (l): l is LanguageCode => isLanguageCode(l) && l !== "tr",
  );
  const lang = languages.find((l) => l === params.lang) ?? languages[0];
  const onlyMissing = params.missing === "1";

  const header = (
    <>
      <Link
        href={`/panel/menu?branch=${branch.id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Menü
      </Link>
      <PageHeader
        title="Çeviriler"
        description="Türkçe metin altına seçilen dildeki karşılığını yazın. Çevirisi olmayan alan menüde Türkçe görünür."
        actions={
          branches.length > 1 && (
            <BranchSwitcher
              branches={branches}
              value={branch.id}
              basePath="/panel/menu/translations"
            />
          )
        }
      />
    </>
  );

  if (!lang) {
    return (
      <>
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <LanguagesIcon
              className="size-8 text-muted-foreground"
              aria-hidden
            />
            <p className="font-medium">Bu şubede yalnızca Türkçe açık.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Menüyü başka dillerde sunmak için şube ayarlarından dil ekleyin.
            </p>
            {user.role === "OWNER" && (
              <Link
                href={`/panel/branches/${branch.id}`}
                className={buttonVariants()}
              >
                Şube ayarları
              </Link>
            )}
          </CardContent>
        </Card>
      </>
    );
  }

  const categories = await db.category.findMany({
    where: { branchId: branch.id, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: { variants: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const missingCount = (l: LanguageCode) =>
    (canProduct
      ? categories
          .flatMap((c) => c.products)
          .filter((p) => isProductMissing(p, l)).length
      : 0) +
    (canCategory
      ? categories.filter((c) => missingFields(c, l).length > 0).length
      : 0);

  const sections = categories
    .map((category) => ({
      category,
      categoryMissing: canCategory && missingFields(category, lang).length > 0,
      products: canProduct
        ? category.products.filter(
            (p) => !onlyMissing || isProductMissing(p, lang),
          )
        : [],
    }))
    .filter((s) => !onlyMissing || s.categoryMissing || s.products.length > 0);

  const href = (next: { lang?: string; missing?: boolean }) => {
    const search = new URLSearchParams({
      branch: branch.id,
      lang: next.lang ?? lang,
    });
    if (next.missing ?? onlyMissing) search.set("missing", "1");
    return `/panel/menu/translations?${search}`;
  };

  return (
    <>
      {header}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Dil" className="flex gap-1 overflow-x-auto">
          {languages.map((l) => {
            const count = missingCount(l);
            return (
              <Link
                key={l}
                href={href({ lang: l })}
                aria-current={l === lang ? "page" : undefined}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted",
                  l === lang && "bg-muted font-medium text-foreground",
                )}
              >
                {getLanguage(l).name}
                {count > 0 ? (
                  <Badge variant="secondary" className="tabular-nums">
                    {count} eksik
                  </Badge>
                ) : (
                  <CheckCircle2Icon
                    className="size-4 text-emerald-600"
                    aria-label="Tamamlandı"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          href={href({ missing: !onlyMissing })}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {onlyMissing ? "Tümünü göster" : "Yalnızca eksikleri göster"}
        </Link>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2Icon className="size-8 text-emerald-600" aria-hidden />
            <p className="font-medium">
              {onlyMissing
                ? `${getLanguage(lang).name} çevirisi eksik kayıt yok.`
                : "Bu şubede henüz menü yok."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <TranslationForm
          key={`${branch.id}-${lang}-${onlyMissing}`}
          branchId={branch.id}
          lang={lang}
        >
          {sections.map(({ category, categoryMissing, products }) => {
            const ct = readTranslations(category.translations)[lang];
            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.name}
                    {categoryMissing && (
                      <Badge variant="secondary">Eksik</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {canCategory && (!onlyMissing || categoryMissing) && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <TranslationField
                        name={`c:${category.id}:name`}
                        label="Kategori adı"
                        source={category.name}
                        value={ct?.name}
                        lang={lang}
                      />
                      {category.description && (
                        <TranslationField
                          name={`c:${category.id}:description`}
                          label="Kategori açıklaması"
                          source={category.description}
                          value={ct?.description}
                          lang={lang}
                          multiline
                        />
                      )}
                    </div>
                  )}
                  {products.map((product) => {
                    const pt = readTranslations(product.translations)[lang];
                    const namedVariants = product.variants.filter(
                      (v) => v.name,
                    );
                    return (
                      <fieldset
                        key={product.id}
                        className="grid gap-4 border-t pt-4 md:grid-cols-2"
                      >
                        <legend className="sr-only">{product.name}</legend>
                        <TranslationField
                          name={`p:${product.id}:name`}
                          label="Ürün adı"
                          source={product.name}
                          value={pt?.name}
                          lang={lang}
                        />
                        {product.description && (
                          <TranslationField
                            name={`p:${product.id}:description`}
                            label="Açıklama"
                            source={product.description}
                            value={pt?.description}
                            lang={lang}
                            multiline
                          />
                        )}
                        {namedVariants.map((variant) => (
                          <TranslationField
                            key={variant.id}
                            name={`v:${variant.id}:name`}
                            label={`${product.name} · boy`}
                            source={variant.name!}
                            value={
                              readTranslations(variant.translations)[lang]?.name
                            }
                            lang={lang}
                          />
                        ))}
                      </fieldset>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TranslationForm>
      )}
    </>
  );
}
