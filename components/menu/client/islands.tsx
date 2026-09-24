"use client";

import { useEffect, useRef, useState } from "react";
import { GlobeIcon, SearchIcon } from "lucide-react";
import { useMenu } from "./context";

/** Ürün kartı: dokununca detay kartını açar. JavaScript yoksa ürüne kaydırır. */
export function ProductLink({
  id,
  className,
  children,
  anchor = true,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  /** Ürün listesindeki asıl bağlantı; öne çıkanlar gibi tekrarlarda false (tekil id). */
  anchor?: boolean;
}) {
  const { open } = useMenu();
  return (
    <a
      id={anchor ? `p-${id}` : undefined}
      href={`#p-${id}`}
      aria-haspopup="dialog"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        open({ type: "product", id });
      }}
    >
      {children}
    </a>
  );
}

/** Çalışma saati, Wi-Fi, adres gibi bilgi çiplerini bilgi kartına bağlar. */
export function InfoButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useMenu();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className={className}
      onClick={() => open({ type: "info" })}
    >
      {children}
    </button>
  );
}

/** Arama ve dil düğmeleri. */
export function MenuToolbar({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName: string;
}) {
  const { open, data } = useMenu();
  return (
    <div className={className}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={data.text.search}
        className={buttonClassName}
        onClick={() => open({ type: "search" })}
      >
        <SearchIcon className="size-5" aria-hidden />
      </button>
      {data.languages.length > 1 && (
        <button
          type="button"
          aria-haspopup="dialog"
          className={buttonClassName}
          onClick={() => open({ type: "language" })}
        >
          <GlobeIcon className="size-5" aria-hidden />
          <span className="sr-only">{data.text.language}: </span>
          <span className="text-xs font-bold uppercase">{data.lang}</span>
        </button>
      )}
    </div>
  );
}

/**
 * Yapışkan kategori çubuğu: kaydırdıkça görünen kategori işaretlenir, dokununca oraya kayar.
 * Temalar yalnızca görünümü (sınıfları) verir.
 */
export function CategoryNav({
  categories,
  label,
  className,
  itemClassName,
  activeItemClassName,
}: {
  categories: { id: string; name: string }[];
  label: string;
  className: string;
  itemClassName: string;
  activeItemClassName: string;
}) {
  const [active, setActive] = useState(categories[0]?.id);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`c-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) setActive(visible.target.id.slice(2));
      },
      // Ekranın üst kısmındaki bölüm "aktif" sayılır.
      { rootMargin: "-20% 0px -70% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  // Aktif kategori çubukta görünür kalsın.
  useEffect(() => {
    const item = navRef.current?.querySelector<HTMLElement>(
      `[data-id="${active}"]`,
    );
    item?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [active]);

  return (
    <nav ref={navRef} aria-label={label} className={className}>
      {categories.map((category) => (
        <a
          key={category.id}
          data-id={category.id}
          href={`#c-${category.id}`}
          aria-current={category.id === active ? "true" : undefined}
          className={
            category.id === active ? activeItemClassName : itemClassName
          }
          onClick={(e) => {
            e.preventDefault();
            const reduced = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            document
              .getElementById(`c-${category.id}`)
              ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
            setActive(category.id);
          }}
        >
          {category.name}
        </a>
      ))}
    </nav>
  );
}
