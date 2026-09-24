import {
  Bricolage_Grotesque,
  Cormorant_Garamond,
  Fraunces,
  Jost,
  Nunito_Sans,
} from "next/font/google";

// Tema yazı tipleri (Faz 0.1). Geist kök düzende yüklenir. `preload: false`: yalnızca
// seçili temanın yazı tipi kullanıldığında indirilir, menü açılışını yavaşlatmaz.
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  preload: false,
});
const jost = Jost({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-jost",
  preload: false,
});
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  preload: false,
});
const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-nunito-sans",
  preload: false,
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  preload: false,
});

/** Menü yazı tiplerinin CSS değişkenleri; menüyü saran öğeye verilir. */
export const menuFontVariables = [
  cormorant,
  jost,
  fraunces,
  nunitoSans,
  bricolage,
]
  .map((font) => font.variable)
  .join(" ");
