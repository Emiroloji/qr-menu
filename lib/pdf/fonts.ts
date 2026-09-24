import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

// PDF'in varsayılan yazı tipi (Helvetica) Türkçe karakterleri içermez. Geist Türkçe ve
// Kiril alfabesini destekler (OFL lisanslı; dosyalar assets/fonts altında).
const dir = path.join(process.cwd(), "assets/fonts");

Font.register({
  family: "Geist",
  fonts: [
    { src: path.join(dir, "Geist-Regular.ttf"), fontWeight: 400 },
    { src: path.join(dir, "Geist-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(dir, "Geist-Bold.ttf"), fontWeight: 700 },
  ],
});
// Uzun kelimelerin tire ile bölünmesini kapatır (Türkçe hecelemesi desteklenmiyor).
Font.registerHyphenationCallback((word) => [word]);

export const PDF_FONT = "Geist";
