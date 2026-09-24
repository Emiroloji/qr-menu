import { expect, test } from "@playwright/test";
import { signIn, seedPassword } from "./helpers";

const ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@qrmenu.local";

test("süper admin işletmenin gözünden bakar, değişiklik yapamaz", async ({
  page,
}) => {
  await signIn(page, ADMIN, seedPassword());
  await expect(page).toHaveURL(/\/admin/);
  await page.goto("/admin/businesses");
  await page.getByRole("link", { name: "Limon Kafe" }).first().click();
  await page.getByRole("button", { name: "İşletmenin gözünden bak" }).click();

  await expect(page).toHaveURL(/\/panel$/);
  await expect(
    page.getByText("işletmesinin panelini sahibi gibi görüntülüyorsunuz"),
  ).toBeVisible();

  // Kaydetme denemesi reddedilir.
  await page.goto("/panel/settings");
  await page.getByRole("button", { name: "Kaydet" }).first().click();
  await expect(
    page.getByText("İşletmenin gözünden bakarken değişiklik yapılamaz."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Görüntülemeyi bitir" }).click();
  await expect(page).toHaveURL(/\/admin\/businesses\/.+/);
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/admin/);
});

test("abonelik hatırlatma ucu gizli anahtar ister", async ({ request }) => {
  const url = "/api/cron/subscription-reminders";
  expect((await request.post(url)).status()).toBe(401);
  expect(
    (
      await request.post(url, {
        headers: { Authorization: "Bearer yanlis-anahtar-000000000" },
      })
    ).status(),
  ).toBe(401);
  const ok = await request.post(url, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toHaveProperty("sent");
});
