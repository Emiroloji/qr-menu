import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Panel içinde bulunamayan kayıt (başka işletmenin kaydı da buraya düşer). */
export default function AreaNotFound() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border bg-background p-6">
      <div className="flex items-center gap-2">
        <SearchXIcon className="size-5 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">Kayıt bulunamadı</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Aradığınız kayıt silinmiş veya size ait olmayabilir.
      </p>
      <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
        İşletmelere dön
      </Link>
    </div>
  );
}
