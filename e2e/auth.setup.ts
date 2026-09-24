import { test as setup } from "@playwright/test";
import { OWNER, OWNER_STATE, signInAs } from "./helpers";

// İşletme sahibi bir kez giriş yapar; oturum diğer testlerde kullanılır
// (giriş hız sınırına takılmamak için).
setup("işletme sahibi oturumu", async ({ page }) => {
  await signInAs(page, OWNER);
  await page.context().storageState({ path: OWNER_STATE });
});
