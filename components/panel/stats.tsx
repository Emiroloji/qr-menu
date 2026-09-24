import Link from "next/link";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// İstatistik ekranlarının ortak parçaları (panel ve süper admin). Grafikler sunucuda
// çizilir; kütüphane ve istemci JavaScript'i gerekmez. Her grafiğin ekran okuyucular
// için bir tablo karşılığı vardır.

const numberFormatter = new Intl.NumberFormat("tr-TR");
export const formatCount = (n: number) => numberFormatter.format(n);

/** Tek sayı ve (varsa) önceki döneme göre değişim. */
export function StatTile({
  label,
  value,
  change,
  note,
}: {
  label: string;
  value: number;
  /** Yüzde; önceki dönem boşsa null */
  change?: number | null;
  note?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatCount(value)}
        </p>
        {change != null && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {change >= 0 ? (
              <ArrowUpRightIcon className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRightIcon className="size-3.5" aria-hidden />
            )}
            <span>
              {change >= 0 ? "+" : "−"}%{Math.abs(change)} {note}
            </span>
          </p>
        )}
        {change == null && note && (
          <p className="text-xs text-muted-foreground">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Grafik ızgarası için yuvarlak üst sınır: 7 → 8, 43 → 50, 180 → 200. */
export function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value)!;
  return step * magnitude;
}

export type Column = { key: string; label: string; value: number };

/** Tek serili sütun grafiği; üzerine gelince veya odaklanınca değer görünür. */
export function ColumnChart({
  data,
  caption,
  unit,
  labelEvery = 1,
  labelFrom = "end",
}: {
  data: Column[];
  caption: string;
  /** Değer birimi, ör. "tarama" */
  unit: string;
  /** Eksende her kaçıncı etiket yazılır */
  labelEvery?: number;
  /** Etiket sayımı sondan (bugün hep yazılı) veya baştan (00:00 hep yazılı) */
  labelFrom?: "start" | "end";
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const edge = Math.max(1, Math.floor(data.length / 6));

  return (
    <figure className="flex flex-col gap-2">
      <div aria-hidden className="flex gap-2">
        <div className="relative h-48 flex-1">
          {/* Izgara: üst sınır ve yarısı */}
          {[1, 0.5].map((f) => (
            <div
              key={f}
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ bottom: `${f * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end gap-0.5 border-b border-border">
            {data.map((d, i) => (
              <div
                key={d.key}
                tabIndex={0}
                aria-label={`${d.label}: ${formatCount(d.value)} ${unit}`}
                className="group relative flex h-full flex-1 items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className="w-full rounded-t-sm bg-primary transition-opacity group-hover:opacity-80"
                  style={{ height: `${(d.value / max) * 100}%` }}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-md bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background shadow-sm group-hover:block group-focus-visible:block",
                    i < edge
                      ? "left-0"
                      : i >= data.length - edge
                        ? "right-0"
                        : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <span className="font-medium tabular-nums">
                    {formatCount(d.value)}
                  </span>{" "}
                  {unit} · {d.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative w-8 text-xs text-muted-foreground tabular-nums">
          <span className="absolute top-0 -translate-y-1/2">
            {formatCount(max)}
          </span>
          <span className="absolute top-1/2 -translate-y-1/2">
            {formatCount(max / 2)}
          </span>
          <span className="absolute bottom-0 translate-y-1/2">0</span>
        </div>
      </div>
      <div aria-hidden className="mr-10 flex gap-0.5">
        {data.map((d, i) => (
          <span
            key={d.key}
            className="flex-1 overflow-visible text-center text-xs whitespace-nowrap text-muted-foreground"
          >
            {(labelFrom === "end" ? data.length - 1 - i : i) % labelEvery === 0
              ? d.label
              : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>
                {formatCount(d.value)} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export type BarRow = {
  key: string;
  label: React.ReactNode;
  sublabel?: string;
  value: number;
};

/** Sıralı yatay çubuk listesi; etiket ve değer her zaman yazılıdır. */
export function BarList({
  rows,
  unit,
  showShare = false,
}: {
  rows: BarRow[];
  unit: string;
  /** Değerin yanında toplam içindeki payı (%) */
  showShare?: boolean;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-medium">{r.label}</span>
              {r.sublabel && (
                <span className="text-muted-foreground"> · {r.sublabel}</span>
              )}
            </span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              <span className="font-medium text-foreground">
                {formatCount(r.value)}
              </span>{" "}
              {unit}
              {showShare && total > 0 && (
                <> · %{Math.round((r.value / total) * 100)}</>
              )}
            </span>
          </div>
          <div aria-hidden className="h-2 overflow-hidden rounded-sm bg-muted">
            <div
              className="h-full rounded-sm bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Bağlantılardan oluşan seçim düğmeleri (dönem, aralık); durum adreste taşınır. */
export function SegmentLinks({
  label,
  options,
}: {
  label: string;
  options: { href: string; label: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="inline-flex w-fit rounded-lg border bg-muted/50 p-0.5"
    >
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          scroll={false}
          aria-current={o.active ? "true" : undefined}
          className={cn(
            "flex h-8 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground",
            o.active && "bg-background text-foreground shadow-sm",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

/** Veri yokken grafiğin yerine gösterilir. */
export function EmptyStats({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex h-32 items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
