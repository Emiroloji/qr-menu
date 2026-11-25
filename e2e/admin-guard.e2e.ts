import { expect, test } from "@playwright/test";
import { OWNER, OWNER_STATE } from "./helpers";

// Yönetim sayfaları yalnızca layout'taki kontrole güvenemez: istemci gezintisinde
// (RSC isteği) paylaşılan layout yeniden çalışmaz. İstek, yönetici çerçevesi zaten
// açıkmış gibi gönderilir; sayfa yine de veri vermemeli.

const ADMIN_TREE = encodeURIComponent(
  JSON.stringify([
    "",
    {
      children: [
        "(admin)",
        { children: ["admin", { children: ["__PAGE__", {}] }] },
      ],
    },
  ]),
);

const PAGES = ["/admin/businesses", "/admin/subscriptions", "/admin/plans"];

async function fetchAsNavigation(
  request: import("@playwright/test").APIRequestContext,
  path: string,
) {
  const res = await request.get(path, {
    headers: { RSC: "1", "Next-Router-State-Tree": ADMIN_TREE },
  });
  return res.text();
}

test.describe("yönetim sayfaları gezinti isteğinde de korunur", () => {
  for (const path of PAGES) {
    test(`girişsiz: ${path}`, async ({ playwright, baseURL }) => {
      const request = await playwright.request.newContext({ baseURL });
      const body = await fetchAsNavigation(request, path);
      expect(body).toContain("NEXT_REDIRECT");
      expect(body).not.toContain(OWNER);
      expect(body).not.toContain("Limon Kafe");
      await request.dispose();
    });

    test(`işletme sahibi: ${path}`, async ({ playwright, baseURL }) => {
      const request = await playwright.request.newContext({
        baseURL,
        storageState: OWNER_STATE,
      });
      const body = await fetchAsNavigation(request, path);
      expect(body).toContain("NEXT_REDIRECT");
      expect(body).not.toContain(OWNER);
      expect(body).not.toContain("Limon Kafe");
      await request.dispose();
    });
  }
});
