import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * Gerçek, okutulabilir karekod; modülleri tek tek çizilir. `animated` ise modüller
 * sayfa açılışında yerine oturur (globals.css → .site-module).
 */
export function QrArt({
  value,
  animated = false,
  className,
}: {
  value: string;
  animated?: boolean;
  className?: string;
}) {
  const { size, data } = QRCode.create(value, {
    errorCorrectionLevel: "M",
  }).modules;
  const modules: { x: number; y: number }[] = [];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (data[y * size + x]) modules.push({ x, y });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("fill-current", className)}
      aria-hidden
    >
      {modules.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="1.03"
          height="1.03"
          className={animated ? "site-module" : undefined}
          style={
            animated
              ? { animationDelay: `${150 + ((x * 31 + y * 17) % 23) * 32}ms` }
              : undefined
          }
        />
      ))}
    </svg>
  );
}

/** Bölüm geçişi: sarı alan kare kare çözülerek beyaza karışır. */
export function ModuleEdge({ className }: { className?: string }) {
  const COLS = 24;
  const CELL = 16;
  // Satır aşağı indikçe seyrekleşir; desen sabittir (her derlemede aynı).
  const rows = [0.86, 0.5, 0.2];
  const cells: { x: number; y: number }[] = [];
  rows.forEach((density, y) => {
    for (let x = 0; x < COLS; x++) {
      const noise = ((x * 7919 + y * 104729 + x * y * 31) % 100) / 100;
      if (noise < density) cells.push({ x, y });
    }
  });
  return (
    <svg
      width="100%"
      height={rows.length * CELL}
      className={cn("block fill-current", className)}
      aria-hidden
    >
      <defs>
        <pattern
          id="site-module-edge"
          width={COLS * CELL}
          height={rows.length * CELL}
          patternUnits="userSpaceOnUse"
        >
          {cells.map(({ x, y }) => (
            <rect
              key={`${x}-${y}`}
              x={x * CELL}
              y={y * CELL}
              width={CELL}
              height={CELL}
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#site-module-edge)" />
    </svg>
  );
}
