import type { MenuThemeCode } from "@/lib/menu-themes";
import { menuFontVariables } from "../fonts";
import type { MenuLabels } from "../labels";
import { MenuStyle } from "../menu-style";
import type { MenuData } from "../types";
import { LuxuryTheme } from "./luxury";
import { MinimalTheme } from "./minimal";
import { VibrantTheme } from "./vibrant";
import { WarmTheme } from "./warm";

export type ThemeProps = { data: MenuData; labels?: MenuLabels };

const THEMES: Record<MenuThemeCode, (props: ThemeProps) => React.ReactNode> = {
  minimal: MinimalTheme,
  luxury: LuxuryTheme,
  warm: WarmTheme,
  vibrant: VibrantTheme,
};

/** Seçili temayı, renk değişkenleri ve yazı tipleriyle birlikte çizer. */
export function ThemedMenu({
  data,
  scope,
  mode,
  labels,
}: {
  data: MenuData;
  scope: string;
  mode?: "light" | "dark";
  labels?: MenuLabels;
}) {
  const Theme = THEMES[data.appearance.theme];
  return (
    <div data-menu-scope={scope} className={`${menuFontVariables} h-full`}>
      <MenuStyle
        scope={scope}
        theme={data.appearance.theme}
        color={data.appearance.color}
        mode={mode}
      />
      <Theme data={data} labels={labels} />
    </div>
  );
}
