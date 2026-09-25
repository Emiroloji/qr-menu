"use client";

import { useRef, useState, useTransition } from "react";
import {
  AlertTriangleIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  type ImportSummary,
  importMenu,
  previewMenuImport,
} from "@/actions/excel";
import { Field, FormError } from "@/components/panel/field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const MAX_SIZE = 900 * 1024;

/** Menüyü Excel olarak indirme ve Excel'den ürün içe aktarma (Faz 3.3). */
export function ExcelDialog({
  branchId,
  branchName,
  canImport,
}: {
  branchId: string;
  branchName: string;
  canImport: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setFile(null);
    setSummary(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function body() {
    const data = new FormData();
    data.set("branchId", branchId);
    if (file) data.set("file", file);
    return data;
  }

  function preview(next: File) {
    setFile(next);
    setSummary(null);
    setError(null);
    if (next.size > MAX_SIZE) {
      setError("Dosya en fazla 900 KB olabilir.");
      return;
    }
    const data = new FormData();
    data.set("branchId", branchId);
    data.set("file", next);
    startTransition(async () => {
      const result = await previewMenuImport(data);
      if (result.ok) setSummary(result.data);
      else setError(result.error);
    });
  }

  function apply() {
    startTransition(async () => {
      const result = await importMenu(body());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { created, updated } = result.data;
      toast.success(
        `İçe aktarıldı: ${created} yeni ürün, ${updated} güncellenen ürün.`,
      );
      setOpen(false);
      reset();
    });
  }

  const ready = summary && summary.errors.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <FileSpreadsheetIcon />
        Excel
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Excel</DialogTitle>
          <DialogDescription>
            {branchName} şubesinin menüsünü indirin; düzenleyip geri yükleyerek
            ürünleri toplu ekleyin veya güncelleyin.
          </DialogDescription>
        </DialogHeader>

        <a
          href={`/api/excel/${branchId}`}
          className={buttonVariants({ variant: "outline", className: "w-fit" })}
        >
          <DownloadIcon />
          Menüyü indir (.xlsx)
        </a>

        {canImport && (
          <div className="flex flex-col gap-4 border-t pt-4">
            <Field
              label="Excel'den içe aktar"
              htmlFor="excel-file"
              hint="Aynı kategoride aynı adlı ürün güncellenir, yoksa eklenir. Dosyada olmayan ürünler silinmez; görseller ve çeviriler korunur."
            >
              <Input
                ref={inputRef}
                id="excel-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={pending}
                onChange={(e) => {
                  const next = e.target.files?.[0];
                  if (next) preview(next);
                }}
              />
            </Field>

            {pending && !summary && (
              <p className="text-sm text-muted-foreground">Dosya okunuyor…</p>
            )}

            {summary && (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <p>
                  <strong>{summary.created}</strong> yeni ürün eklenecek,{" "}
                  <strong>{summary.updated}</strong> ürün güncellenecek.
                </p>
                {summary.newCategories.length > 0 && (
                  <p>Yeni kategoriler: {summary.newCategories.join(", ")}</p>
                )}
                {summary.errors.length > 0 && (
                  <div className="flex flex-col gap-1 text-destructive">
                    <p className="flex items-center gap-1.5 font-medium">
                      <AlertTriangleIcon className="size-4" aria-hidden />
                      Şu satırlar düzeltilmeli:
                    </p>
                    <ul className="max-h-40 list-inside list-disc overflow-y-auto">
                      {summary.errors.map((e) => (
                        <li key={e.row}>
                          {e.row}. satır: {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <FormError error={error} />
          </div>
        )}

        {canImport && (
          <DialogFooter>
            <Button type="button" disabled={!ready || pending} onClick={apply}>
              {pending && summary ? "İçe aktarılıyor…" : "İçe aktar"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
