import { expect, test } from "@playwright/test";
import { OWNER_STATE } from "./helpers";

test.use({ storageState: OWNER_STATE });

// Excel (Faz 3.3). Menüyü değiştirmez: indirilen dosya aynen yüklenir ve yalnızca
// önizlenir; yeni ürün çıkmamalı.
test("menü Excel olarak indirilir, aynı dosya önizlemede değişiklik göstermez", async ({
  page,
}, testInfo) => {
  await page.goto("/panel/menu");
  await page.getByRole("button", { name: "Excel" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Menüyü indir (.xlsx)" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^menu-limon-kafe-.+\.xlsx$/);
  const file = testInfo.outputPath("menu.xlsx");
  await download.saveAs(file);

  await page.locator("#excel-file").setInputFiles(file);
  await expect(page.getByText(/^0 yeni ürün eklenecek/)).toBeVisible();
  await expect(page.getByText("Şu satırlar düzeltilmeli")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "İçe aktar" })).toBeEnabled();
});

test("Excel dosyası olmayan yükleme reddedilir", async ({ page }, testInfo) => {
  const file = testInfo.outputPath("menu.xlsx");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(file, "bu bir excel dosyası değil");
  await page.goto("/panel/menu");
  await page.getByRole("button", { name: "Excel" }).click();
  await page.locator("#excel-file").setInputFiles(file);
  await expect(
    page.getByText("Dosya okunamadı. Excel (.xlsx) dosyası yükleyin."),
  ).toBeVisible();
});
