import { expect, test } from "@playwright/test";

// İşletmenin kendi alan adı (Faz 3.2): proxy davranışı. Kayıtlı olmayan bir alan adı
// menü göstermez; sistem adresleri platforma yönlendirilir.
const headers = { Host: "menu.kayitsiz-isletme.test" };

test("kayıtlı olmayan alan adında menü açılmaz", async ({ request }) => {
  const response = await request.get("/", { headers });
  expect(response.status()).toBe(404);
});

test("alan adında panel ve giriş platforma yönlendirilir", async ({
  request,
}) => {
  for (const path of ["/panel", "/login", "/admin/businesses"]) {
    const response = await request.get(path, { headers, maxRedirects: 0 });
    expect(response.status()).toBe(307);
    // Next.js, hedef sunucunun kendi adresiyle aynıysa yönlendirmeyi göreli yazar
    // (server/web/adapter.js). Yerelde platform = localhost:3000 olduğu için "/panel";
    // canlıda platform adresi farklı olduğundan tam adres (https://platform/panel) döner.
    expect(response.headers().location).toMatch(
      new RegExp(`^(http://localhost:3000)?${path}$`),
    );
  }
});

test("SSL sertifikası yalnızca kayıtlı alan adına verilir", async ({
  request,
}) => {
  const response = await request.get(
    "/api/domains/allowed?domain=menu.kayitsiz-isletme.test",
  );
  expect(response.status()).toBe(404);
});
