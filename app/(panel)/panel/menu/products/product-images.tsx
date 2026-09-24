"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { deleteProductImage, reorderProductImages } from "@/actions/product";
import { FormError } from "@/components/panel/field";
import { SortableList } from "@/components/panel/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { productImageSrc } from "@/lib/product-image";

type ProductImage = { id: string; url: string; blurDataUrl: string | null };

export function ProductImages({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upload(files: File[]) {
    setError(null);
    startTransition(async () => {
      let uploaded = 0;
      for (const [index, file] of files.entries()) {
        setProgress(`${index + 1} / ${files.length} yükleniyor…`);
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(
          `/api/upload?kind=product&productId=${productId}`,
          {
            method: "POST",
            body,
          },
        );
        if (!response.ok) {
          const result: { error?: string } = await response
            .json()
            .catch(() => ({}));
          setError(`${file.name}: ${result.error ?? "Yüklenemedi."}`);
          break;
        }
        uploaded++;
      }
      setProgress(null);
      if (uploaded) toast.success(`${uploaded} görsel eklendi.`);
      router.refresh();
    });
  }

  function remove(imageId: string) {
    startTransition(async () => {
      const result = await deleteProductImage({ imageId });
      if (result.ok) toast.success("Görsel silindi.");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Görseller</CardTitle>
        <CardDescription>
          JPEG, PNG veya WebP · en fazla 10 MB · en fazla 10 görsel. İlk görsel
          kapak olur; sürükleyerek sıralayın.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {images.length > 0 && (
          <SortableList
            key={images.map((i) => i.id).join()}
            items={images}
            layout="grid"
            onReorder={(ids) =>
              reorderProductImages({ parentId: productId, ids })
            }
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {(image, handle) => (
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <Image
                  src={productImageSrc(image.url, 400)}
                  alt={productName}
                  fill
                  sizes="200px"
                  unoptimized
                  placeholder={image.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={image.blurDataUrl ?? undefined}
                  className="object-cover"
                />
                <div className="absolute inset-x-1 top-1 flex items-center justify-between">
                  <span className="rounded-md bg-background/90">{handle}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    aria-label="Görseli sil"
                    disabled={pending}
                    onClick={() => remove(image.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                {image.id === images[0].id && (
                  <Badge className="absolute bottom-1 left-1">Kapak</Badge>
                )}
              </div>
            )}
          </SortableList>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Görsel seç"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            if (files.length) upload(files);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={pending || images.length >= 10}
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon />
            Görsel ekle
          </Button>
          {progress && (
            <span role="status" className="text-sm text-muted-foreground">
              {progress}
            </span>
          )}
        </div>
        <FormError error={error} />
      </CardContent>
    </Card>
  );
}
