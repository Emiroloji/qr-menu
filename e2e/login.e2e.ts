import { expect, test } from "@playwright/test";
import { signIn, signInAs, STAFF } from "./helpers";

test.describe("giriş", () => {
  test("hatalı şifrede hata gösterir ve panele girmez", async ({ page }) => {
    await signIn(page, "olmayan@limonkafe.test", "yanlis-sifre-123");
    await expect(page.getByText("E-posta veya şifre hatalı.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("oturum yoksa panel girişe yönlendirir", async ({ page }) => {
    await page.goto("/panel/menu");
    await expect(page).toHaveURL(/\/login/);
  });

  test("çalışan girer, yalnızca yetkili olduğu ekranları görür", async ({
    page,
  }) => {
    await signInAs(page, STAFF);
    await expect(page.getByRole("heading", { name: /Merhaba/ })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Panel menüsü" }).first();
    await expect(nav.getByRole("link", { name: "Menü" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Şubeler" })).toHaveCount(0);

    // Adresi elle yazsa da sahip ekranlarına giremez.
    await page.goto("/panel/branches");
    await expect(page).toHaveURL(/\/panel$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/panel$/);

    await page.getByRole("button", { name: "Çıkış yap" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
