import {
  type Browser,
  type BrowserContext,
  expect,
  test,
} from "@playwright/test";
import { MENU_PATH, OWNER_STATE, seedPassword, signIn } from "./helpers";

// Müşteri değerlendirmeleri. Örnek işletme (Limon Kafe) Standart pakettedir; test
// paketi yönetimden açar ve sonunda yeniden kapatır.

const ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@qrmenu.local";
// Başsız tarayıcının "HeadlessChrome" kimliği bot sayılır; gönderim reddedilir.
const PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

// Yönetici bir kez giriş yapar (giriş hız sınırına takılmamak için); oturum saklanır.
let adminState: Awaited<ReturnType<BrowserContext["storageState"]>> | null =
  null;

async function setStandardFeedback(browser: Browser, on: boolean) {
  const context = await browser.newContext(
    adminState ? { storageState: adminState } : {},
  );
  const page = await context.newPage();
  if (!adminState) {
    await signIn(page, ADMIN, seedPassword());
    await expect(page).toHaveURL(/\/admin/);
    adminState = await context.storageState();
  }
  await page.goto("/admin/plans");
  await page.getByRole("link", { name: "Standart", exact: true }).click();
  const box = page.getByRole("checkbox", {
    name: "Müşteri değerlendirmeleri",
  });
  if ((await box.isChecked()) !== on) await box.click();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText("Paket güncellendi.")).toBeVisible();
  await context.close();
}

test.describe.serial("müşteri değerlendirmeleri", () => {
  test.use({ userAgent: PHONE_UA });

  test.afterAll(async ({ browser }) => {
    await setStandardFeedback(browser, false);
  });

  test("paket kapalıyken menüde buton, panelde öğe yok", async ({
    browser,
    page,
  }) => {
    await setStandardFeedback(browser, false);
    await page.goto(MENU_PATH);
    await expect(
      page.getByRole("button", { name: "Bizi değerlendirin" }),
    ).toHaveCount(0);

    const owner = await browser.newContext({ storageState: OWNER_STATE });
    const panel = await owner.newPage();
    await panel.goto("/panel/feedback");
    await expect(
      panel.getByText("Paketiniz müşteri değerlendirmelerini içermiyor."),
    ).toBeVisible();
    await owner.close();
  });

  test("menüden gönderilen değerlendirme panelde görünür ve silinir", async ({
    browser,
    page,
  }) => {
    await setStandardFeedback(browser, true);
    await page.goto(MENU_PATH);
    await page.getByRole("button", { name: "Bizi değerlendirin" }).click();
    await page.locator('label:has(input[value="4"])').click();
    const text = `E2E değerlendirme ${Date.now()}`;
    await page.getByLabel("Mesajınız (isteğe bağlı)").fill(text);
    await page.getByRole("button", { name: "Gönder" }).click();
    await expect(
      page.getByText("Teşekkürler! Değerlendirmeniz iletildi."),
    ).toBeVisible();

    const owner = await browser.newContext({ storageState: OWNER_STATE });
    const panel = await owner.newPage();
    await panel.goto("/panel/feedback");
    const row = panel.getByRole("listitem").filter({ hasText: text });
    await expect(row).toBeVisible();
    await expect(row.getByRole("img", { name: "4 yıldız" })).toBeVisible();
    await row.getByRole("button", { name: "Sil" }).click();
    await panel
      .getByRole("alertdialog")
      .getByRole("button", { name: "Sil" })
      .click();
    await expect(panel.getByText("Değerlendirme silindi.")).toBeVisible();
    await expect(panel.getByText(text)).toHaveCount(0);
    await owner.close();
  });
});
