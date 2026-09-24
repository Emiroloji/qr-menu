import { getLanguage } from "@/lib/languages";
import type { MenuThemeCode } from "@/lib/menu-themes";
import type { MenuClientData } from "../client-data";
import { MenuProvider } from "../client/provider";
import { menuFontVariables } from "../fonts";
import type { MenuLabels } from "../labels";
import { MenuStyle } from "../menu-style";
import type { MenuData } from "../types";
import { LuxuryTheme } from "./luxury";
import { MinimalTheme } from "./minimal";
import { VibrantTheme } from "./vibrant";
import { WarmTheme } from "./warm";

export type ThemeProps = { data: MenuData; labels: MenuLabels };

const THEMES: Record<MenuThemeCode, (props: ThemeProps) => React.ReactNode> = {
  minimal: MinimalTheme,
  luxury: LuxuryTheme,
  warm: WarmTheme,
  vibrant: VibrantTheme,
};

/**
 * Seçili temayı renk değişkenleri, yazı tipleri ve etkileşimli parçalarla birlikte çizer.
 * Dil ve yazı yönü (Arapça: sağdan sola) menü kapsayıcısına verilir.
 */
export function ThemedMenu({
  data,
  labels,
  client,
  scope,
  mode,
}: {
  data: MenuData;
  labels: MenuLabels;
  client: MenuClientData;
  scope: string;
  mode?: "light" | "dark";
}) {
  const Theme = THEMES[data.appearance.theme];
  return (
    <div
      data-menu-scope={scope}
      lang={data.lang}
      dir={getLanguage(data.lang).dir}
      className={`${menuFontVariables} min-h-full`}
    >
      <MenuStyle
        scope={scope}
        theme={data.appearance.theme}
        color={data.appearance.color}
        mode={mode}
      />
      <MenuProvider data={client}>
        <Theme data={data} labels={labels} />
      </MenuProvider>
    </div>
  );
}
