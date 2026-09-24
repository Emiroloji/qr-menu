"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { copyMenu } from "@/actions/menu";
import { Field, FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormAction } from "@/hooks/use-form-action";

export function CopyMenuDialog({
  from,
  targets,
}: {
  from: { id: string; name: string };
  targets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(targets[0]?.id ?? "");
  const { pending, error, onSubmit } = useFormAction(copyMenu, ({ count }) => {
    toast.success(`${count} ürün kopyalandı.`);
    setOpen(false);
    router.push(`/panel/menu?branch=${target}`);
  });
  const items = targets.map((t) => ({
    value: t.id,
    label: `${t.name} şubesi`,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CopyIcon />
        Menüyü kopyala
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Menüyü başka şubeye kopyala</DialogTitle>
          <DialogDescription>
            “{from.name}” şubesindeki kategoriler, ürünler, fiyatlar ve
            görseller kopyalanır. Kopyadan sonra şubelerin menüleri birbirinden
            bağımsızdır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="fromBranchId" value={from.id} />
          <Field label="Hedef şube" htmlFor="copy-target">
            <Select
              name="toBranchId"
              items={items}
              value={target}
              onValueChange={(v) => v && setTarget(v)}
            >
              <SelectTrigger id="copy-target" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-start gap-2">
            <Checkbox id="copy-replace" name="replace" className="mt-0.5" />
            <Label htmlFor="copy-replace" className="leading-snug font-normal">
              Hedef şubede menü varsa sil ve yerine kopyala
            </Label>
          </div>
          <FormError error={error} />
          <DialogFooter>
            <Button type="submit" disabled={pending || !target}>
              {pending ? "Kopyalanıyor…" : "Kopyala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
