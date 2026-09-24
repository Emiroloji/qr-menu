"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCategory } from "@/actions/category";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormAction } from "@/hooks/use-form-action";

export type CategoryValues = {
  id: string;
  name: string;
  description: string | null;
  isVisible: boolean;
};

export function CategoryDialog({
  branchId,
  category,
  trigger,
}: {
  branchId: string;
  category?: CategoryValues;
  trigger: React.ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, error, onSubmit } = useFormAction(saveCategory, ({ id }) => {
    toast.success(category ? "Kategori kaydedildi." : "Kategori eklendi.");
    setOpen(false);
    if (!category) router.push(`/panel/menu?branch=${branchId}&category=${id}`);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "Kategoriyi düzenle" : "Yeni kategori"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {category ? (
            <input type="hidden" name="id" value={category.id} />
          ) : (
            <input type="hidden" name="branchId" value={branchId} />
          )}
          <Field label="Kategori adı" htmlFor="category-name">
            <Input
              id="category-name"
              name="name"
              defaultValue={category?.name}
              placeholder="Örn. Kahveler"
              required
              autoFocus
            />
          </Field>
          <Field label="Açıklama (isteğe bağlı)" htmlFor="category-description">
            <Textarea
              id="category-description"
              name="description"
              rows={2}
              defaultValue={category?.description ?? ""}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox
              id="category-visible"
              name="isVisible"
              defaultChecked={category?.isVisible ?? true}
            />
            <Label htmlFor="category-visible">Menüde görünür</Label>
          </div>
          <FormError error={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
