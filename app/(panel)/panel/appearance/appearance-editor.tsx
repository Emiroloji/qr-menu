"use client";

import { useState } from "react";
import { CheckIcon, MoonIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";
import { saveAppearance } from "@/actions/appearance";
import { ThemedMenu } from "@/components/menu/themes";
import type { MenuData } from "@/components/menu/types";
import { FormError } from "@/components/panel/field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useFormAction } from "@/hooks/use-form-action";
import { HEX_COLOR } from "@/lib/color";
import {
  MENU_THEME_CODES,
  MENU_THEMES,
  type MenuThemeCode,
} from "@/lib/menu-themes";
import { cn } from "@/lib/utils";

const SWATCHES = [
  "#2F5D50",
  "#1F3A8A",
  "#2436D9",
  "#6B2150",
  "#B4532A",
  "#8C5A2B",
  "#C9A96E",
  "#1B1B19",
];

export function AppearanceEditor({
  preview,
  savedTheme,
  savedColor,
  branding,
  children,
}: {
  preview: MenuData;
  savedTheme: MenuThemeCode;
  savedColor: string;
  /** Paket "Logo ve renkler" içeriyor mu */
  branding: boolean;
  /** Kapak görseli kartı */
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState(savedTheme);
  const [color, setColor] = useState(
    branding ? savedColor : MENU_THEMES[savedTheme].defaultColor,
  );
  const [mode, setMode] = useState<"light" | "dark">("light");
  const { pending, error, onSubmit } = useFormAction(saveAppearance, () =>
    toast.success("Görünüm kaydedildi. Menünüz güncellendi."),
  );

  const effectiveColor = branding ? color : MENU_THEMES[theme].defaultColor;
  const data: MenuData = {
    ...preview,
    appearance: { ...preview.appearance, theme, color: effectiveColor },
  };
  const dirty = theme !== savedTheme || (branding && color !== savedColor);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
      <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tema</CardTitle>
            <CardDescription>
              Tüm temalar aynı menüyü gösterir; yalnızca düzen ve stil değişir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <legend className="sr-only">Tema</legend>
              {MENU_THEME_CODES.map((code) => {
                const def = MENU_THEMES[code];
                const selected = code === theme;
                return (
                  <label
                    key={code}
                    className={cn(
                      "relative flex cursor-pointer gap-3 rounded-xl border p-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      selected && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={code}
                      checked={selected}
                      onChange={() => {
                        setTheme(code);
                        if (!branding) setColor(def.defaultColor);
                      }}
                      className="sr-only"
                    />
                    <span
                      className="flex h-12 w-10 shrink-0 overflow-hidden rounded-md border"
                      aria-hidden
                    >
                      <span
                        className="flex-1"
                        style={{ background: def.light.bg }}
                      />
                      <span
                        className="w-3"
                        style={{ background: def.defaultColor }}
                      />
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">{def.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {def.description}
                      </span>
                    </span>
                    {selected && (
                      <CheckIcon
                        className="absolute top-3 right-3 size-4"
                        aria-hidden
                      />
                    )}
                  </label>
                );
              })}
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ana renk</CardTitle>
            <CardDescription>
              {branding
                ? "İşletmenizin rengi. Okunaklı kalması için gerekirse menüde otomatik olarak açılıp koyulaştırılır."
                : "Hazır temalar kendi rengini kullanır. Kendi renginizi seçmek Standart ve üzeri paketlerde mümkündür."}
            </CardDescription>
          </CardHeader>
          {branding && (
            <CardContent className="flex flex-col gap-4">
              <input type="hidden" name="primaryColor" value={color} />
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Hazır renkler"
              >
                {[
                  MENU_THEMES[theme].defaultColor,
                  ...SWATCHES.filter(
                    (s) => s !== MENU_THEMES[theme].defaultColor,
                  ),
                ].map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    role="radio"
                    aria-checked={color.toUpperCase() === swatch}
                    aria-label={swatch}
                    onClick={() => setColor(swatch)}
                    className={cn(
                      "size-10 rounded-full border-2 border-background outline-offset-2",
                      color.toUpperCase() === swatch &&
                        "outline-2 outline-primary",
                    )}
                    style={{ background: swatch }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value.toUpperCase())}
                  aria-label="Özel renk seç"
                  className="size-10 cursor-pointer rounded-md border bg-transparent p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => {
                    const value = e.target.value.startsWith("#")
                      ? e.target.value
                      : `#${e.target.value}`;
                    if (HEX_COLOR.test(value)) setColor(value.toUpperCase());
                  }}
                  aria-label="Renk kodu"
                  className="w-28 font-mono uppercase"
                  maxLength={7}
                  defaultValue={color}
                  key={color}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {children}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? "Kaydediliyor…" : "Görünümü kaydet"}
          </Button>
          {dirty && (
            <span className="text-sm text-muted-foreground">
              Kaydedilmemiş değişiklik var.
            </span>
          )}
          <FormError error={error} />
        </div>
      </form>

      <section
        aria-label="Canlı önizleme"
        className="flex flex-col items-center gap-3 xl:sticky xl:top-4"
      >
        <div
          className="flex items-center gap-1 rounded-lg bg-muted p-1"
          role="radiogroup"
          aria-label="Önizleme modu"
        >
          {(
            [
              ["light", "Açık", SunIcon],
              ["dark", "Karanlık", MoonIcon],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground",
                mode === value &&
                  "bg-background font-medium text-foreground shadow-sm",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="h-180 w-96 max-w-full overflow-hidden rounded-[2.5rem] border-8 border-foreground bg-foreground shadow-xl">
          <div className="h-full overflow-y-auto rounded-[2rem]">
            <ThemedMenu data={data} scope="preview" mode={mode} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Müşteri menüsünde telefonun karanlık mod ayarı izlenir.
        </p>
      </section>
    </div>
  );
}
