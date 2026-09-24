import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { StatusScreen, statusActionClass } from "@/components/status-screen";

export const metadata: Metadata = { title: "Sayfa bulunamadı" };

export default function NotFound() {
  return (
    <StatusScreen
      icon={<SearchXIcon className="size-8" aria-hidden />}
      title="Sayfa bulunamadı"
      description="Aradığınız sayfa taşınmış veya hiç var olmamış olabilir."
      secondary={<span lang="en">Page not found.</span>}
      action={
        <Link href="/" className={statusActionClass}>
          Ana sayfaya dön
        </Link>
      }
    />
  );
}
