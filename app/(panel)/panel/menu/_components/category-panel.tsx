"use client";

import Link from "next/link";
import { ClockIcon, EyeOffIcon, PlusIcon } from "lucide-react";
import { reorderCategories } from "@/actions/category";
import { SortableList } from "@/components/panel/sortable-list";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryDialog } from "./category-dialog";

type CategoryItem = {
  id: string;
  name: string;
  isVisible: boolean;
  /** Görünme saatleri, ör. "08:00–11:00" */
  hours: string | null;
  productCount: number;
};

export function CategoryPanel({
  branchId,
  categories,
  selectedId,
  canEdit,
}: {
  branchId: string;
  categories: CategoryItem[];
  selectedId: string | null;
  canEdit: boolean;
}) {
  return (
    <section
      aria-label="Kategoriler"
      className="flex flex-col gap-1 self-start rounded-xl border bg-background p-2"
    >
      <div className="flex items-center justify-between px-2 py-1">
        <h2 className="text-sm font-semibold">Kategoriler</h2>
        {canEdit && (
          <CategoryDialog
            branchId={branchId}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Kategori ekle">
                <PlusIcon />
              </Button>
            }
          />
        )}
      </div>
      {categories.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          Henüz kategori yok.
        </p>
      ) : (
        <SortableList
          // Ad, görünürlük, saat veya sayı değişince de liste yenilenir.
          key={JSON.stringify(categories)}
          items={categories}
          disabled={!canEdit}
          onReorder={(ids) => reorderCategories({ parentId: branchId, ids })}
          className="flex flex-col gap-0.5"
        >
          {(category, handle) => (
            <div
              className={cn(
                "flex items-center gap-1 rounded-md pr-2",
                !handle && "pl-2",
                category.id === selectedId && "bg-muted",
              )}
            >
              {handle}
              <Link
                href={`/panel/menu?branch=${branchId}&category=${category.id}`}
                aria-current={category.id === selectedId ? "page" : undefined}
                className="flex min-h-10 flex-1 items-center gap-2 text-sm font-medium"
              >
                <span className="flex-1 truncate">{category.name}</span>
                {category.hours && (
                  <ClockIcon
                    className="size-3.5 text-muted-foreground"
                    aria-label={`${category.hours} arası görünür`}
                  />
                )}
                {!category.isVisible && (
                  <EyeOffIcon
                    className="size-3.5 text-muted-foreground"
                    aria-label="Gizli"
                  />
                )}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {category.productCount}
                </span>
              </Link>
            </div>
          )}
        </SortableList>
      )}
    </section>
  );
}
