import { expect, test } from "@playwright/test";

// Tanıtım sayfaları (Faz 3.4): ana sayfa, örnek menü, yardım merkezi.

test("ana sayfa hesap talebi e-postasını ve paketleri gösterir", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Menünüz, masadaki QR kodda.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Hesap talep edin" }).first(),
  ).toHaveAttribute("href", /^mailto:.+subject=Hesap%20talebi/);
  await expect(page.getByRole("heading", { name: "Paketler" })).toBeVisible();

  // Hero'daki örnek menü gerçek menüdür; ürün detayı açılır.
  const demo = page.frameLocator('iframe[title^="Örnek menü"]');
  await demo.getByText("Latte", { exact: true }).first().click();
  await expect(demo.getByRole("dialog", { name: "Latte" })).toBeVisible();
});

test("örnek menüde tema değiştirilir", async ({ page }) => {
  await page.goto("/demo");
  await expect(page.getByText("Örnek Kahve Evi").first()).toBeVisible();
  await page.getByRole("link", { name: "Lüks" }).click();
  await expect(page).toHaveURL(/tema=luxury/);
  await expect(page.getByRole("link", { name: "Lüks" })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("yardım merkezinde konu açılır", async ({ page }) => {
  await page.goto("/yardim");
  await page.getByText("Menümü Excel'den yükleyebilir miyim?").click();
  await expect(
    page.getByText(/dosyada olmayan ürünler silinmez/),
  ).toBeVisible();
});
