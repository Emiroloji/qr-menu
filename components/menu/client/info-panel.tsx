"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  MapPinIcon,
  PhoneIcon,
  WifiIcon,
} from "lucide-react";
import { DAYS } from "@/lib/branch-info";
import type { MenuClientData } from "../client-data";

const SOCIAL_NAMES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  website: "Web",
};

export function InfoPanel({ data }: { data: MenuClientData }) {
  const { text, branch } = data;
  const [copied, setCopied] = useState(false);
  const socials = Object.entries(branch.socials).filter(([, url]) => url);

  return (
    <div className="flex flex-col gap-6 px-5 pt-6 pb-8">
      <header className="pe-10">
        <h2 className="font-menu-display text-2xl font-bold">
          {branch.businessName}
        </h2>
        <p className="text-menu-muted">{branch.name}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          <ClockIcon className="size-4" aria-hidden />
          {text.hours}
        </h3>
        <dl className="flex flex-col text-sm">
          {DAYS.map(([day]) => {
            const ranges = branch.openingHours[day];
            return (
              <div
                key={day}
                className="flex justify-between border-b border-menu-line py-2 last:border-b-0"
              >
                <dt>{text[day]}</dt>
                <dd className="tabular-nums">
                  {ranges?.length
                    ? ranges.map((r) => r.join("–")).join(", ")
                    : text.closed}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {branch.wifi && (
        <section className="flex items-center gap-3">
          <WifiIcon className="size-5 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm text-menu-muted">{text.wifi}</span>
            <span className="font-semibold break-all">{branch.wifi}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(branch.wifi!);
              setCopied(true);
            }}
            className="flex h-11 items-center gap-1.5 rounded-full border border-menu-line px-4 text-sm font-semibold"
          >
            {copied ? (
              <CheckIcon className="size-4" aria-hidden />
            ) : (
              <CopyIcon className="size-4" aria-hidden />
            )}
            {copied ? text.copied : text.copy}
          </button>
        </section>
      )}

      {branch.address && (
        <section className="flex items-start gap-3">
          <MapPinIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex flex-col gap-1">
            <span>{branch.address}</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.businessName} ${branch.address}`)}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-menu-accent-text underline underline-offset-4"
            >
              {text.openInMaps}
            </a>
          </div>
        </section>
      )}

      {branch.phone && (
        <a
          href={`tel:${branch.phone.replace(/\s/g, "")}`}
          className="flex min-h-11 items-center gap-3"
        >
          <PhoneIcon className="size-5 shrink-0" aria-hidden />
          <span dir="ltr">{branch.phone}</span>
        </a>
      )}

      {socials.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">{text.socials}</h3>
          <div className="flex flex-wrap gap-2">
            {socials.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center rounded-full border border-menu-line px-4 text-sm font-semibold"
              >
                {SOCIAL_NAMES[key] ?? key}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
