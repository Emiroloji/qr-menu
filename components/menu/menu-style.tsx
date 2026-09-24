import { type MenuThemeCode, themeVariables } from "@/lib/menu-themes";

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");

/**
 * Temanın renklerini CSS değişkeni olarak yazar. Varsayılan: telefonun karanlık mod ayarını
 * izler (çerez gerekmez). `mode` verilirse (panel önizlemesi) o mod zorlanır.
 * Değerler yalnızca doğrulanmış hex renkler ve sabit yazı tipi değişkenleridir.
 */
export function MenuStyle({
  scope,
  theme,
  color,
  mode,
}: {
  scope: string;
  theme: MenuThemeCode;
  color: string;
  mode?: "light" | "dark";
}) {
  const { light, dark } = themeVariables(theme, color);
  const selector = `[data-menu-scope="${scope.replace(/[^a-zA-Z0-9_-]/g, "")}"]`;
  const css = mode
    ? `${selector}{${declarations(mode === "dark" ? dark : light)}}`
    : `${selector}{${declarations(light)}}@media (prefers-color-scheme: dark){${selector}{${declarations(dark)}}}`;
  return <style>{css}</style>;
}
