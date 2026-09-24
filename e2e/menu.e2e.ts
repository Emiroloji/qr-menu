import { devices, expect, test } from "@playwright/test";
import { MENU_PATH } from "./helpers";

// Müşteri: telefon, oturumsuz.
test.use({ ...devices["Pixel 7"] });

test.describe("müşteri menüsü", () => {
  test("açılır; kategoriler, ürünler ve ürün detayı görünür", async ({
    page,
  }) => {
    await page.goto(MENU_PATH);
    await expect(
      page.getByRole("heading", { level: 1, name: "Limon Kafe" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Kategoriler" }),
    ).toBeVisible();

    await page.getByRole("link", { name: /Latte/ }).first().click();
    const detail = page.getByRole("dialog", { name: "Latte" });
    await expect(detail).toBeVisible();
    await expect(detail.getByText("Alerjenler")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(detail).toBeHidden();
  });

  test("aramada ürün bulunur", async ({ page }) => {
    await page.goto(MENU_PATH);
    await page.getByRole("button", { name: "Menüde ara" }).click();
    await page.getByPlaceholder("Ürün, içerik veya kategori ara").fill("mocha");
    await expect(page.getByText("1 ürün bulundu")).toBeVisible();
  });

  test("dil İngilizceye geçer", async ({ page }) => {
    await page.goto(`${MENU_PATH}?lang=en`);
    await expect(page.locator("[data-menu-scope]")).toHaveAttribute(
      "lang",
      "en",
    );
    await expect(
      page.getByRole("button", { name: "Search the menu" }),
    ).toBeVisible();
  });

  test("olmayan menü için bulunamadı sayfası", async ({ page }) => {
    const response = await page.goto("/limon-kafe/olmayan-sube");
    expect(response?.status()).toBe(404);
  });
});
