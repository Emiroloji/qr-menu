"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, setCategoryVisibility } from "@/actions/category";
import { ConfirmButton } from "@/components/panel/confirm-button";
import { Button } from "@/components/ui/button";
import { CategoryDialog, type CategoryValues } from "./category-dialog";

export function CategoryActions({
  branchId,
  category,
  productCount,
}: {
  branchId: string;
  category: CategoryValues;
  productCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleVisibility() {
    startTransition(async () => {
      const result = await setCategoryVisibility({
        categoryId: category.id,
        isVisible: !category.isVisible,
      });
      if (result.ok)
        toast.success(
          category.isVisible
            ? "Kategori gizlendi."
            : "Kategori menüde görünüyor.",
        );
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CategoryDialog
        branchId={branchId}
        category={category}
        trigger={
          <Button variant="outline" size="sm">
            <PencilIcon />
            Düzenle
          </Button>
        }
      />
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={toggleVisibility}
      >
        {category.isVisible ? <EyeOffIcon /> : <EyeIcon />}
        {category.isVisible ? "Gizle" : "Göster"}
      </Button>
      <ConfirmButton
        destructive
        title={`“${category.name}” silinsin mi?`}
        description={
          productCount > 0
            ? `İçindeki ${productCount} ürün de menüden kalkar. Yanlışlıkla silinen kategori destek ekibi tarafından geri getirilebilir.`
            : "Kategori menüden kalkar."
        }
        confirmLabel="Sil"
        successMessage="Kategori silindi."
        onConfirm={async () => {
          const result = await deleteCategory({ categoryId: category.id });
          if (result.ok) router.push(`/panel/menu?branch=${branchId}`);
          return result;
        }}
      >
        Sil
      </ConfirmButton>
    </div>
  );
}
