import "server-only";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import {
  COLUMNS,
  type ColumnKey,
  type ExportProduct,
  mapHeaders,
  MAX_IMPORT_ROWS,
  type Reference,
  type SheetRow,
  toSheetRow,
} from "@/lib/menu-sheet";
import { BADGES } from "@/lib/validations/menu";

// Menünün Excel dosyası (Faz 3.3): okuma/yazma (ExcelJS) ve veritabanı sorguları.

// Server Action gövde sınırı (Next.js varsayılanı 1 MB) içinde kalır.
export const MAX_EXCEL_SIZE = 900 * 1024; // 900 KB
const SHEET_NAME = "Menü";

/** Türkçe alerjen ve etiket adları (Excel'de adlarıyla yazılır). */
export async function getSheetReference(): Promise<Reference> {
  const [allergens, tags] = await Promise.all([
    db.allergen.findMany({ select: { code: true, name: true } }),
    db.tag.findMany({ select: { code: true, name: true } }),
  ]);
  return { allergens, tags };
}

/** Şubenin tüm ürünleri (gizliler dahil, silinmişler hariç), menü sırasıyla. */
export async function getExportProducts(
  branchId: string,
): Promise<ExportProduct[]> {
  const categories = await db.category.findMany({
    where: { branchId, deletedAt: null },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          variants: { orderBy: { sortOrder: "asc" } },
          allergens: { include: { allergen: { select: { code: true } } } },
          tags: { include: { tag: { select: { code: true } } } },
        },
      },
    },
  });
  return categories.flatMap((c) =>
    c.products.map((p) => ({
      category: c.name,
      name: p.name,
      description: p.description,
      variants: p.variants.map((v) => ({ name: v.name, price: v.price })),
      ingredients: p.ingredients,
      portion: p.portion,
      prepTime: p.prepTime,
      origin: p.origin,
      spiceLevel: p.spiceLevel,
      allergens: p.allergens.map((a) => ({
        code: a.allergen.code,
        level: a.level,
      })),
      tagCodes: p.tags.map((t) => t.tag.code),
      badges: p.badges,
      isVisible: p.isVisible,
      isAvailable: p.isAvailable,
    })),
  );
}

/** Menüyü .xlsx olarak yazar. Boş menüde dosya doldurulacak şablon olarak kullanılır. */
export async function writeMenuWorkbook(
  products: ExportProduct[],
  ref: Reference,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "QR Menü";
  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = COLUMNS.map((c) => ({
    key: c.key,
    header: c.header,
    width: c.width,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.getColumn("price").numFmt = "#,##0.00";
  for (const product of products) sheet.addRow(toSheetRow(product, ref));

  // Evet/Hayır ve acılık için açılır liste.
  const last = Math.max(products.length + 1, 200);
  const column = (key: ColumnKey) => sheet.getColumn(key).letter;
  for (const key of ["isVisible", "isAvailable"] as const) {
    for (let r = 2; r <= last; r++) {
      sheet.getCell(`${column(key)}${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Evet,Hayır"'],
      };
    }
  }

  const help = workbook.addWorksheet("Nasıl doldurulur");
  help.columns = [{ width: 28 }, { width: 90 }];
  const lines: [string, string][] = [
    ["Satır", "Her satır bir ürün. Kategori ve Ürün zorunlu."],
    [
      "Fiyat (TL)",
      "Tek fiyatlı ürün için, ör. 85,50. Boylar doluysa kullanılmaz.",
    ],
    ["Boylar", "Çok boylu ürün için, ör. Küçük=85; Orta=95; Büyük=110"],
    ["Hazırlanma (dk)", "Dakika, tam sayı."],
    ["Acılık (0-3)", "0 acı değil, 1 az, 2 orta, 3 çok acı."],
    [
      "Alerjenler",
      `Virgülle ayırın. Kullanılabilecekler: ${ref.allergens.map((a) => a.name).join(", ")}`,
    ],
    ["Etiketler", `Virgülle ayırın: ${ref.tags.map((t) => t.name).join(", ")}`],
    ["Rozetler", `Virgülle ayırın: ${Object.values(BADGES).join(", ")}`],
    ["Menüde görünür / Mevcut", "Evet veya Hayır. Boş bırakılırsa Evet."],
    [
      "İçe aktarma",
      "Aynı kategoride aynı adlı ürün varsa güncellenir, yoksa eklenir. Dosyada olmayan ürünler silinmez. Olmayan kategoriler oluşturulur. Görseller, çeviriler ve besin değerleri dosyada yoktur; mevcut ürünlerde korunur.",
    ],
  ];
  help.addRows(lines);
  help.getColumn(1).font = { bold: true };
  help.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  // Sayı hücreleri Excel biçiminden bağımsız okunur (85.5 → "85.5").
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "result" in value)
    return value.result === undefined ? "" : String(value.result);
  return cell.text ?? "";
}

export type ReadResult =
  | { ok: true; rows: { row: number; values: SheetRow }[] }
  | { ok: false; error: string };

/** İlk sayfanın ("Menü") başlık satırını eşler ve satırları okur. */
export async function readMenuWorkbook(
  buffer: ArrayBuffer,
): Promise<ReadResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    return {
      ok: false,
      error: "Dosya okunamadı. Excel (.xlsx) dosyası yükleyin.",
    };
  }
  const sheet = workbook.getWorksheet(SHEET_NAME) ?? workbook.worksheets[0];
  if (!sheet) return { ok: false, error: "Dosyada sayfa bulunamadı." };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  for (let c = 1; c <= headerRow.cellCount; c++)
    headers.push(cellText(headerRow.getCell(c)));
  const { keys, missing } = mapHeaders(headers);
  if (missing.length)
    return {
      ok: false,
      error: `Başlık satırında şu sütunlar yok: ${missing.join(", ")}. Menüyü indirip şablon olarak kullanın.`,
    };

  const rows: { row: number; values: SheetRow }[] = [];
  sheet.eachRow({ includeEmpty: false }, (excelRow, number) => {
    if (number === 1) return;
    const values: SheetRow = {};
    keys.forEach((key, i) => {
      if (key) values[key] = cellText(excelRow.getCell(i + 1)).trim();
    });
    rows.push({ row: number, values });
  });
  if (rows.length > MAX_IMPORT_ROWS)
    return {
      ok: false,
      error: `Dosyada en fazla ${MAX_IMPORT_ROWS} ürün olabilir.`,
    };
  return { ok: true, rows };
}
