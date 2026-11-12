"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Ana ekrandaki sahne: panelde yapılan üç değişiklik telefondaki menüde görünür,
// masadaki karekod hiç değişmez. Karekod sunucuda çizilir ve `qr` olarak gelir.

const CHANGES = [
  null,
  "Latte ₺95 oldu",
  "San Sebastian tükendi",
  "Soğuk demleme eklendi",
] as const;
const DURATIONS = [2400, 2800, 2800, 4200];
const LAST = CHANGES.length - 1;

function Row({
  swatch,
  name,
  note,
  price,
  soldOut = false,
  changed,
}: {
  swatch: string;
  name: string;
  note: string;
  price: number;
  soldOut?: boolean;
  changed: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-2 transition-colors duration-700 sm:gap-2.5",
          changed ? "bg-site-lemon/45" : "bg-transparent",
        )}
      >
        <span
          className={cn(
            "size-7 shrink-0 rounded-md sm:size-9 lg:size-10 transition-[filter,opacity] duration-500",
            soldOut && "opacity-40 grayscale",
          )}
          style={{ backgroundColor: swatch }}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              "truncate text-[13px] leading-tight font-semibold",
              soldOut && "text-site-muted",
            )}
          >
            {name}
          </span>
          <span className="truncate text-[11px] leading-tight text-site-muted">
            {soldOut ? "Tükendi" : note}
          </span>
        </span>
        <span className="relative h-5 w-9 overflow-hidden text-right text-[13px] font-semibold tabular-nums">
          <AnimatePresence initial={false}>
            <motion.span
              key={price}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn(
                "absolute inset-0",
                soldOut && "text-site-muted line-through",
              )}
            >
              ₺{price}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
    </motion.li>
  );
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** Sunucuda ve ilk çizimde false; tercih istemcide okunur (hydration uyuşmazlığı olmaz). */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

export function HeroScene({ qr }: { qr: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) return;
    // İlk tur, karekod yerine oturduktan sonra başlar.
    const timer = setTimeout(
      () => setStep((s) => (s + 1) % CHANGES.length),
      step === 0 ? DURATIONS[0] + 600 : DURATIONS[step],
    );
    return () => clearTimeout(timer);
  }, [step, reduced]);

  // Hareket istemeyenler son hâli, sabit olarak görür.
  const shown = reduced ? LAST : step;
  const change = CHANGES[shown];

  return (
    <div
      className="relative mx-auto w-full max-w-md select-none lg:max-w-lg"
      aria-hidden
    >
      {/* Panelde yapılan değişiklik */}
      <div className="flex h-12 items-start justify-end pr-2 sm:pr-6">
        <AnimatePresence mode="wait">
          {change && (
            <motion.div
              key={change}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 rounded-lg bg-site-ink py-2 pr-3.5 pl-2.5 text-sm font-medium text-white shadow-lg"
            >
              <span className="flex size-6 items-center justify-center rounded bg-site-lemon text-site-ink">
                <PencilIcon className="size-3.5" />
              </span>
              <span className="text-white/60">Panelde</span>
              {change}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-end justify-center gap-3 sm:gap-6">
        {/* Masa kartı: karekod hiç değişmez */}
        <div className="mb-8 flex w-32 shrink-0 -rotate-3 flex-col items-center gap-2 rounded-xl bg-white p-3 shadow-[0_18px_30px_-14px_rgb(22_33_29/0.55)] sm:w-44 sm:p-4 lg:w-52">
          <div className="w-full text-site-ink">{qr}</div>
          <span className="text-center font-site-display text-[13px] leading-tight font-bold sm:text-base lg:text-lg">
            Menü için okutun
          </span>
          <span className="text-[11px] leading-none text-site-muted">
            Masa 4
          </span>
        </div>

        {/* Telefon: menü değişir */}
        <div className="w-52 shrink-0 rounded-[1.75rem] bg-site-ink p-1.5 shadow-[0_24px_40px_-16px_rgb(22_33_29/0.6)] sm:w-56 lg:w-64">
          <div className="flex h-98 flex-col overflow-hidden rounded-[1.4rem] bg-white sm:h-100 lg:h-108">
            <div className="flex items-baseline justify-between bg-site-green px-3.5 pt-5 pb-3 text-white">
              <span className="font-site-display text-lg leading-none font-bold">
                Limon Kafe
              </span>
              <span className="text-[11px] text-white/70">Masa 4</span>
            </div>
            <div className="flex gap-1.5 border-b border-site-line px-3 py-2 text-[11px] font-medium">
              <span className="rounded-md bg-site-ink px-2 py-1 text-white">
                İçecekler
              </span>
              <span className="rounded-md bg-site-mist px-2 py-1 text-site-muted">
                Tatlılar
              </span>
              <span className="rounded-md bg-site-mist px-2 py-1 text-site-muted">
                Kahvaltı
              </span>
            </div>
            <ul className="flex flex-col gap-0.5 p-1.5">
              <AnimatePresence initial={false}>
                <Row
                  key="latte"
                  swatch="#b98a5e"
                  name="Latte"
                  note="Çift shot, buharda süt"
                  price={shown >= 1 ? 95 : 85}
                  changed={shown === 1}
                />
                <Row
                  key="sansebastian"
                  swatch="#e8c26a"
                  name="San Sebastian"
                  note="Günlük, ev yapımı"
                  price={140}
                  soldOut={shown >= 2}
                  changed={shown === 2}
                />
                <Row
                  key="limonata"
                  swatch="#f2d64b"
                  name="Limonata"
                  note="Taze nane ile"
                  price={70}
                  changed={false}
                />
                <Row
                  key="turk"
                  swatch="#6b4a3a"
                  name="Türk kahvesi"
                  note="Lokum ile"
                  price={60}
                  changed={false}
                />
                {shown >= 3 && (
                  <Row
                    key="demleme"
                    swatch="#4a2f22"
                    name="Soğuk demleme"
                    note="18 saat demlenir"
                    price={90}
                    changed={shown === 3}
                  />
                )}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
