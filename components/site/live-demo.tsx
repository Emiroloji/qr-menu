"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Telefon çerçevesinde çalışan örnek menü. Menü, yüklenince kategori çubuğunu ortalamak
 * için `scrollIntoView` çağırır ve bu, çerçeve ekranda değilken dış sayfayı da kaydırır.
 * Bu yüzden çerçeve ancak büyük kısmı görünür olunca yüklenir.
 */
export function LiveDemo({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto h-155 w-77 rounded-4xl bg-site-ink p-2.5 shadow-xl ring-1 ring-site-ink/10 sm:w-85"
    >
      <div className="relative size-full overflow-hidden rounded-3xl bg-white">
        {/* Yüklenene kadar: karekod deseni */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-site-lemon p-10 text-site-ink">
          {children}
          <span className="font-site-display text-lg font-bold">
            Örnek menü açılıyor
          </span>
        </div>
        {visible && (
          <iframe
            src="/demo"
            title="Örnek menü: kategorilere ve ürünlere dokunarak deneyin"
            className="absolute inset-0 size-full bg-white"
          />
        )}
      </div>
    </div>
  );
}
