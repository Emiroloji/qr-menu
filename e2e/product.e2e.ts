import { expect, test } from "@playwright/test";
import { MENU_PATH, OWNER_STATE } from "./helpers";

test.use({ storageState: OWNER_STATE });

test("işletme sahibi ürün ekler, ürün müşteri menüsünde görünür", async ({
  page,
  browser,
}) => {
  const name = `Deneme Tostu ${Date.now()}`;

  await page.goto("/panel/menu");
  await page
    .getByRole("region", { name: "Kategoriler" })
    .getByRole("link", { name: /Salatalar/ })
    .click();
  await expect(
    page.getByRole("heading", { level: 2, name: /Salatalar/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ürün ekle" }).click();

  await page.getByLabel("Ürün adı").fill(name);
  await page.locator("#description").fill("Kaşarlı, domatesli.");
  await page.getByLabel("1. boy fiyatı").fill("120,50");
  await page.getByRole("button", { name: "Ürünü ekle" }).click();
  await expect(page.getByText("Ürün eklendi.")).toBeVisible();
  await expect(page).toHaveURL(/\/panel\/menu\/products\/.+/);

  // Müşteri menüsü (oturumsuz, telefon) yeni ürünü ve fiyatını hemen gösterir.
  const customer = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await customer.goto(MENU_PATH);
  const product = customer.getByRole("link", { name: new RegExp(name) });
  await expect(product).toBeVisible();
  await expect(product).toContainText("₺120,50");
  await customer.close();

  // Temizlik: ürün silinir ve menüden kalkar.
  await page.getByRole("button", { name: "Ürünü sil" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Ürünü sil" })
    .click();
  await expect(page).toHaveURL(/\/panel\/menu/);
  const after = await browser.newPage();
  await after.goto(MENU_PATH);
  await expect(after.getByText(name)).toHaveCount(0);
  await after.close();
});
