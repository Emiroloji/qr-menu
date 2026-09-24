import { expect, type Page } from "@playwright/test";

// Seed'deki örnek işletme (prisma/seed.ts).
export const OWNER = "sahip@limonkafe.test";
export const STAFF = "calisan@limonkafe.test";
export const MENU_PATH = "/limon-kafe/kadikoy";
export const OWNER_STATE = "e2e/.auth/owner.json";

export function seedPassword() {
  const password = process.env.SEED_PASSWORD;
  if (!password) throw new Error("SEED_PASSWORD .env içinde tanımlı olmalı.");
  return password;
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-posta").fill(email);
  await page.getByLabel("Şifre").fill(password);
  await page.getByRole("button", { name: "Giriş yap" }).click();
}

export async function signInAs(page: Page, email: string) {
  await signIn(page, email, seedPassword());
  await expect(page).toHaveURL(/\/panel$/);
}
