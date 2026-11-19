# Müşteri Değerlendirmeleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Müşteri QR menüden 1–5 yıldız ve isteğe bağlı mesaj bırakır; işletme sahibi panelde görür ve siler; özellik paket ayarıyla açılır.

**Architecture:** Yeni `Feedback` tablosu (yalnızca ekleme migration'ı). Paket özelliği `Plan.features.feedback` (JSON, migration yok). Menüde buton → `next/dynamic` ile yüklenen form → oturumsuz Server Action. Panelde sahip sayfası `/panel/feedback`.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma 7 + PostgreSQL 17, Zod 4, next-intl (menü metinleri), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-musteri-degerlendirme-design.md`

## Global Constraints

- **Canlı veri kutsaldır.** Migration yalnızca `CREATE TABLE "Feedback"`, index ve FK içerir; mevcut tabloda `ALTER`, `DROP`, `UPDATE` yok. Canlı sunucuya ve canlı veritabanına bağlanılmaz; her şey yerel Docker veritabanında.
- Commit ve push yalnızca kullanıcı isteyince. Görev sonlarında "kontrol noktası": testler geçer, değişiklik çalışma ağacında kalır.
- Müşteriden kişisel veri istenmez; IP saklanmaz (yalnızca bellekteki hız sınırı anahtarında).
- Menüde shadcn yok; form `components/menu/client/` altında, dinamik yüklenir; menü ilk yük JS'i değişmez.
- Puan 1–5 tam sayı; mesaj en fazla 500 karakter; hız sınırı IP+şube başına saatte 5.
- Paket özellikleri koda gömülmez; varsayılan `feedback: false`.
- Metinler Türkçe; menü metinleri 5 dilde (tr, en, de, ar, ru) aynı anahtarlarla.
- Next.js 16: kod yazmadan önce ilgili rehber `node_modules/next/dist/docs/` altında okunur (AGENTS.md).
- Doğrulama komutları: `npx vitest run`, `npm run typecheck`, `npx eslint <dosyalar>`, `npx playwright test`.

---

### Task 1: Paket özelliği ve yönetim kutusu

**Files:**

- Modify: `lib/validations/plan.ts` (şema + transform)
- Modify: `lib/plan-features.ts` (NONE, `canUseFeedback`)
- Modify: `app/(admin)/admin/plans/plan-form.tsx` (customDomain kutusunun altına)
- Modify: `actions/admin/plan.ts` (kayıttan sonra menü önbelleği)
- Test: `lib/plan-features.test.ts` (yeni)

**Interfaces:**

- Produces: `PlanFeatures.feedback: boolean`; `canUseFeedback(f: PlanFeatures): boolean` (`@/lib/plan-features`).

- [ ] **Step 1: Failing test** — `lib/plan-features.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canUseFeedback, readPlanFeatures } from "@/lib/plan-features";

describe("değerlendirme paket özelliği", () => {
  it("eski paketlerde anahtar yoksa kapalıdır", () => {
    const f = readPlanFeatures({
      appearance: "FULL",
      stats: "DETAILED",
      customDomain: true,
    });
    expect(f.feedback).toBe(false);
    expect(canUseFeedback(f)).toBe(false);
  });
  it("paket ayarında açıksa açıktır", () => {
    const f = readPlanFeatures({
      appearance: "PRESET",
      stats: "NONE",
      feedback: true,
    });
    expect(canUseFeedback(f)).toBe(true);
  });
  it("bozuk değerde kapalıdır", () => {
    expect(canUseFeedback(readPlanFeatures(null))).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run lib/plan-features.test.ts` → FAIL (`canUseFeedback` yok).

- [ ] **Step 3: Implement.**

`lib/validations/plan.ts` — `planFeaturesSchema` içine `customDomain` satırının altına:

```ts
  feedback: z.boolean().default(false),
```

`planSchema` nesnesine `customDomain: checkbox,` altına `feedback: checkbox,`; transform:

```ts
  .transform(({ appearance, stats, customDomain, feedback, ...plan }) => ({
    ...plan,
    features: { appearance, stats, customDomain, feedback } satisfies PlanFeatures,
  }));
```

`lib/plan-features.ts` — `NONE`'a `feedback: false,`; dosya sonuna (assertFeature'dan önce):

```ts
/** Müşteri değerlendirmeleri: paket ayarındaki "Müşteri değerlendirmeleri" */
export const canUseFeedback = (f: PlanFeatures) => f.feedback;
```

`plan-form.tsx` — customDomain bloğunun altına:

```tsx
<div className="flex items-center gap-2">
  <Checkbox
    id="feedback"
    name="feedback"
    defaultChecked={plan?.features.feedback ?? false}
  />
  <Label htmlFor="feedback">Müşteri değerlendirmeleri</Label>
</div>
```

`actions/admin/plan.ts` — import `expireBusinessMenus` from `@/lib/cache`; `try` içinde plan kaydından sonra, `refresh()`'ten önce:

```ts
// Paket özellikleri menüde de kullanılır (görünüm, değerlendirme butonu).
const businesses = await db.business.findMany({
  where: { subscriptions: { some: { planId: plan.id } } },
  select: { id: true },
});
for (const b of businesses) await expireBusinessMenus(b.id);
```

- [ ] **Step 4:** `npx vitest run` → PASS (hepsi). `npx eslint lib/plan-features.ts lib/validations/plan.ts actions/admin/plan.ts "app/(admin)/admin/plans/plan-form.tsx"` temiz.

- [ ] **Step 5: Kontrol noktası** — `npm run typecheck` geçer.

---

### Task 2: Feedback tablosu (yalnızca ekleme)

**Files:**

- Modify: `prisma/schema.prisma` (Branch ilişki alanı + yeni model, ProductView'dan sonra)
- Create: `prisma/migrations/<zaman>_feedback/migration.sql` (Prisma üretir)

**Interfaces:**

- Produces: `db.feedback` — `{ id, branchId, rating: number, message: string | null, language: string, createdAt: Date, readAt: Date | null }`.

- [ ] **Step 1:** `Branch` modeline `productViews  ProductView[]` altına `feedbacks     Feedback[]`. ProductView modelinden sonra:

```prisma
// Müşterinin menüden bıraktığı değerlendirme. Anonimdir: IP veya kişisel veri tutulmaz.
model Feedback {
  id        String    @id @default(cuid())
  branchId  String
  branch    Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  rating    Int // 1–5
  message   String? // en fazla 500 karakter
  language  String
  createdAt DateTime  @default(now())
  readAt    DateTime?

  @@index([branchId, createdAt])
}
```

- [ ] **Step 2:** Yerel veritabanı açık mı: `docker compose up -d db`. `DATABASE_URL`'in `localhost` olduğunu doğrula (`grep DATABASE_URL .env`). Sonra `npx prisma migrate dev --name feedback --create-only`.

- [ ] **Step 3: SQL denetimi (zorunlu).** Üretilen `migration.sql` yalnızca şunları içermeli: `CREATE TABLE "Feedback"`, `CREATE INDEX "Feedback_branchId_createdAt_idx"`, `ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_branchId_fkey"`. Kontrol:

```bash
grep -vE '^(--|$)' prisma/migrations/*_feedback/migration.sql | grep -vE 'Feedback'
```

Expected: boş çıktı. Başka bir tabloya dokunan satır varsa DUR ve kullanıcıya bildir.

- [ ] **Step 4:** `npx prisma migrate dev` (yerel uygular, istemciyi üretir). `npm run typecheck` geçer.

---

### Task 3: Gönderim (doğrulama, hız sınırı, Server Action)

**Files:**

- Create: `lib/validations/feedback.ts`
- Modify: `lib/rate-limit.ts` (`RATE_LIMITS.feedback`)
- Create: `actions/feedback.ts`
- Test: `lib/validations/feedback.test.ts` (yeni), `lib/rate-limit.test.ts` (ekleme)

**Interfaces:**

- Consumes: `canUseFeedback` (Task 1), `db.feedback` (Task 2), `cleanCell` (`@/lib/menu-sheet`), `isBot` (`@/lib/scan-log`), `getCurrentSubscription`, `getBusinessStatus`, `isBusinessOperational` (`@/lib/business-status`).
- Produces: `feedbackSchema`, `FEEDBACK_MESSAGE_MAX = 500`; `submitFeedback(input: unknown): Promise<FeedbackResult>` where `type FeedbackResult = { ok: true } | { ok: false; error: "invalid" | "limited" | "unavailable" }` (hata kodu; menü kendi dilinde metin gösterir).

- [ ] **Step 1: Failing tests.**

`lib/validations/feedback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/validations/feedback";

const base = { branchId: "cmabc123", rating: 5, message: "", lang: "tr" };

describe("değerlendirme doğrulaması", () => {
  it("1–5 arası tam sayı puan kabul eder", () => {
    for (const rating of [1, 3, 5])
      expect(feedbackSchema.safeParse({ ...base, rating }).success).toBe(true);
    for (const rating of [0, 6, 2.5, "5"])
      expect(feedbackSchema.safeParse({ ...base, rating }).success).toBe(false);
  });
  it("boş mesajı null yapar, denetim karakterlerini atar", () => {
    expect(
      feedbackSchema.parse({ ...base, message: "   " }).message,
    ).toBeNull();
    expect(
      feedbackSchema.parse({ ...base, message: " Harika\u0000 " }).message,
    ).toBe("Harika");
  });
  it("500 karakterden uzun mesajı reddeder", () => {
    expect(
      feedbackSchema.safeParse({ ...base, message: "a".repeat(501) }).success,
    ).toBe(false);
    expect(
      feedbackSchema.safeParse({ ...base, message: "a".repeat(500) }).success,
    ).toBe(true);
  });
  it("bilinmeyen dili reddeder", () => {
    expect(feedbackSchema.safeParse({ ...base, lang: "xx" }).success).toBe(
      false,
    );
  });
});
```

`lib/rate-limit.test.ts` sonuna:

```ts
describe("değerlendirme sınırı", () => {
  it("aynı IP ve şubeden saatte 5 değerlendirme", () => {
    const key = `feedback:1.2.3.4:${Math.random()}`;
    const results = Array.from({ length: 6 }, () =>
      consumeRateLimit(key, RATE_LIMITS.feedback, 0),
    );
    expect(results).toEqual([true, true, true, true, true, false]);
    expect(consumeRateLimit(key, RATE_LIMITS.feedback, 60 * 60_000)).toBe(true);
  });
});
```

- [ ] **Step 2:** `npx vitest run lib/validations/feedback.test.ts lib/rate-limit.test.ts` → FAIL.

- [ ] **Step 3: Implement.**

`lib/validations/feedback.ts`:

```ts
import { z } from "zod";
import { isLanguageCode } from "@/lib/languages";
import { cleanCell } from "@/lib/menu-sheet";

export const FEEDBACK_MESSAGE_MAX = 500;

/** Menüden gelen değerlendirme (oturumsuz; her alan sunucuda doğrulanır). */
export const feedbackSchema = z.object({
  branchId: z.string().min(1).max(40),
  rating: z.number().int().min(1).max(5),
  message: z
    .string()
    .max(FEEDBACK_MESSAGE_MAX * 2)
    .transform(cleanCell)
    .pipe(z.string().max(FEEDBACK_MESSAGE_MAX))
    .transform((m) => m || null),
  lang: z.string().refine(isLanguageCode),
});
```

`lib/rate-limit.ts` — `RATE_LIMITS` içine `scan`'dan sonra:

```ts
  /** Menüden değerlendirme (IP ve şube başına). */
  feedback: { limit: 5, windowMs: 60 * MINUTE },
```

`actions/feedback.ts`:

```ts
"use server";

import { headers } from "next/headers";
import {
  getBusinessStatus,
  getCurrentSubscription,
  isBusinessOperational,
} from "@/lib/business-status";
import { db } from "@/lib/db";
import { canUseFeedback, readPlanFeatures } from "@/lib/plan-features";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isBot } from "@/lib/scan-log";
import { feedbackSchema } from "@/lib/validations/feedback";

export type FeedbackResult =
  { ok: true } | { ok: false; error: "invalid" | "limited" | "unavailable" };

/**
 * Müşterinin menüden bıraktığı değerlendirme. Oturum gerektirmez; IP yalnızca hız
 * sınırı için bellekte kullanılır, saklanmaz (KURALLAR 7). Şube yayında olmalı ve
 * paketi değerlendirmeyi içermeli; önbellek değil veritabanı sorgulanır.
 */
export async function submitFeedback(input: unknown): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const requestHeaders = await headers();
  if (isBot(requestHeaders.get("user-agent") ?? ""))
    return { ok: false, error: "invalid" };
  const { branchId, rating, message, lang } = parsed.data;
  if (
    !consumeRateLimit(
      `feedback:${clientIp(requestHeaders)}:${branchId}`,
      RATE_LIMITS.feedback,
    )
  )
    return { ok: false, error: "limited" };

  const branch = await db.branch.findFirst({
    where: { id: branchId, deletedAt: null, business: { deletedAt: null } },
    select: {
      business: {
        select: {
          isActive: true,
          subscriptions: { include: { plan: { select: { features: true } } } },
        },
      },
    },
  });
  if (!branch) return { ok: false, error: "unavailable" };
  const { business } = branch;
  const plan = getCurrentSubscription(business.subscriptions)?.plan;
  if (
    !isBusinessOperational(getBusinessStatus(business)) ||
    !canUseFeedback(readPlanFeatures(plan?.features))
  )
    return { ok: false, error: "unavailable" };

  await db.feedback.create({
    data: { branchId, rating, message, language: lang },
  });
  return { ok: true };
}
```

(`getBusinessStatus` imzasını `lib/business-status.ts`'te doğrula: `{ isActive, subscriptions }` alır; abonelik alanları `status/startsAt/endsAt` içerir — `include` hepsini getirir.)

- [ ] **Step 4:** `npx vitest run` → PASS. `npm run typecheck`, eslint temiz.

---

### Task 4: Menüde buton ve form

**Files:**

- Modify: `components/menu/types.ts` (`MenuData.feedback`)
- Modify: `lib/menu-data.ts` (`MENU_DATA_VERSION = 4`, `feedback` alanı)
- Modify: `lib/demo-menu.ts`, `app/(panel)/panel/appearance/page.tsx` (`feedback: false`)
- Modify: `components/menu/client-data.ts` (`feedbackBranchId`)
- Modify: `messages/{tr,en,de,ar,ru}.json` (menu anahtarları)
- Modify: `components/menu/client/context.ts` (`{ type: "feedback" }`)
- Modify: `components/menu/client/provider.tsx` (dinamik form + Sheet)
- Create: `components/menu/client/feedback-form.tsx` (default export)
- Modify: `components/menu/client/islands.tsx` (`FeedbackButton`)
- Modify: `components/menu/themes/index.tsx` (altbilgi), `components/menu/client/info-panel.tsx`

**Interfaces:**

- Consumes: `submitFeedback`, `FeedbackResult` (Task 3), `canUseFeedback` (Task 1).
- Produces: `MenuClientData.feedbackBranchId: string | null`; `FeedbackButton({ className })`.

- [ ] **Step 1: Veri.** `types.ts` `MenuData`'ya `featuredIds`'ten sonra:

```ts
/** Paket müşteri değerlendirmesini içeriyorsa "Bizi değerlendirin" gösterilir. */
feedback: boolean;
```

`lib/menu-data.ts`: `MENU_DATA_VERSION = 4` (veri şekli değişti; eski önbellek kayıtları okunmaz). `getMenuData` dönüşünde `featuredIds`'ten sonra:

```ts
    feedback: canUseFeedback(readPlanFeatures(plan?.features)),
```

(import `canUseFeedback` from `@/lib/plan-features`.) `lib/demo-menu.ts` ve `appearance/page.tsx`'deki MenuData nesnelerine `feedback: false,`.

`client-data.ts`: tipte `statsBranchId`'den sonra

```ts
/** Değerlendirme gönderilecek şube; paket içermiyorsa veya önizlemede null. */
feedbackBranchId: string | null;
```

`buildClientData` dönüşünde `statsBranchId`'den sonra `feedbackBranchId: data.feedback ? options.branchId : null,`.

- [ ] **Step 2: Metinler.** Her `messages/*.json` `menu` nesnesine (son anahtardan sonra):

| Anahtar         | tr                                                                                                | en                                                                                               | de                                                                                                  | ar                                                                       | ru                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| rateUs          | Bizi değerlendirin                                                                                | Rate us                                                                                          | Bewerten Sie uns                                                                                    | قيّمنا                                                                   | Оцените нас                                                               |
| ratingLabel     | Puanınız                                                                                          | Your rating                                                                                      | Ihre Bewertung                                                                                      | تقييمك                                                                   | Ваша оценка                                                               |
| stars           | {count} yıldız                                                                                    | {count, plural, one {# star} other {# stars}}                                                    | {count, plural, one {# Stern} other {# Sterne}}                                                     | {count} نجوم                                                             | {count, plural, one {# звезда} few {# звезды} other {# звёзд}}            |
| feedbackMessage | Mesajınız (isteğe bağlı)                                                                          | Your message (optional)                                                                          | Ihre Nachricht (optional)                                                                           | رسالتك (اختياري)                                                         | Ваше сообщение (необязательно)                                            |
| feedbackNote    | Değerlendirmeniz anonimdir ve yalnızca işletme tarafından görülür. Lütfen kişisel bilgi yazmayın. | Your feedback is anonymous and only the venue can see it. Please don't include personal details. | Ihre Bewertung ist anonym und nur für den Betrieb sichtbar. Bitte keine persönlichen Daten angeben. | تقييمك مجهول الهوية ولا يراه إلا المنشأة. يُرجى عدم كتابة معلومات شخصية. | Ваш отзыв анонимен и виден только заведению. Не указывайте личные данные. |
| send            | Gönder                                                                                            | Send                                                                                             | Senden                                                                                              | إرسال                                                                    | Отправить                                                                 |
| feedbackThanks  | Teşekkürler! Değerlendirmeniz iletildi.                                                           | Thank you! Your feedback has been sent.                                                          | Danke! Ihre Bewertung wurde gesendet.                                                               | شكرًا! تم إرسال تقييمك.                                                  | Спасибо! Ваш отзыв отправлен.                                             |
| feedbackLimited | Çok fazla değerlendirme gönderildi. Lütfen daha sonra tekrar deneyin.                             | Too many submissions. Please try again later.                                                    | Zu viele Bewertungen. Bitte später erneut versuchen.                                                | تم إرسال عدد كبير من التقييمات. يُرجى المحاولة لاحقًا.                   | Слишком много отзывов. Попробуйте позже.                                  |
| feedbackError   | Değerlendirme gönderilemedi. Lütfen tekrar deneyin.                                               | Your feedback could not be sent. Please try again.                                               | Die Bewertung konnte nicht gesendet werden. Bitte erneut versuchen.                                 | تعذّر إرسال التقييم. يُرجى المحاولة مرة أخرى.                            | Не удалось отправить отзыв. Попробуйте ещё раз.                           |

Doğrula: `python3 -c "import json;[print(l,len(json.load(open(f'messages/{l}.json'))['menu'])) for l in ['tr','en','de','ar','ru']]"` → hepsi 85.

- [ ] **Step 3: Panel tipi ve form.** `context.ts` `Panel` birleşimine `| { type: "feedback" }`.

`components/menu/client/feedback-form.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { StarIcon } from "lucide-react";
import { createTranslator } from "next-intl";
import { submitFeedback } from "@/actions/feedback";
import { FEEDBACK_MESSAGE_MAX } from "@/lib/validations/feedback";
import type { MenuClientData } from "../client-data";

type Status = "idle" | "sending" | "sent" | "limited" | "error";

/** "Bizi değerlendirin" formu: 1–5 yıldız ve isteğe bağlı mesaj. Butona basınca yüklenir. */
export default function FeedbackForm({
  data,
  branchId,
}: {
  data: MenuClientData;
  branchId: string;
}) {
  const { text } = data;
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  if (status === "sent")
    return (
      <p role="status" className="px-5 pt-8 pb-10 text-center font-semibold">
        {text.feedbackThanks}
      </p>
    );

  // ICU çoğulu ("{count, plural, …}") next-intl çözer; menü zaten next-intl kullanır.
  const t = useMemo(
    () =>
      createTranslator({
        locale: data.lang,
        messages: { menu: text },
        namespace: "menu",
      }),
    [data.lang, text],
  );
  const starLabel = (count: number) => t("stars", { count });

  return (
    <form
      className="flex flex-col gap-5 px-5 pt-6 pb-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (rating === 0 || status === "sending") return;
        setStatus("sending");
        try {
          const result = await submitFeedback({
            branchId,
            rating,
            message,
            lang: data.lang,
          });
          setStatus(
            result.ok
              ? "sent"
              : result.error === "limited"
                ? "limited"
                : "error",
          );
        } catch {
          setStatus("error");
        }
      }}
    >
      <h2 className="font-menu-display text-2xl font-bold">{text.rateUs}</h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{text.ratingLabel}</legend>
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{starLabel(n)}</span>
              <StarIcon
                aria-hidden
                className={`size-10 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-menu-accent ${
                  n <= rating
                    ? "fill-menu-accent text-menu-accent"
                    : "text-menu-muted"
                }`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="font-semibold">{text.feedbackMessage}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={FEEDBACK_MESSAGE_MAX}
          rows={4}
          className="rounded-lg border border-menu-line bg-menu-bg p-3 text-base"
        />
        <span className="text-sm text-menu-muted">{text.feedbackNote}</span>
      </label>
      {(status === "limited" || status === "error") && (
        <p role="alert" className="text-sm font-semibold">
          {status === "limited" ? text.feedbackLimited : text.feedbackError}
        </p>
      )}
      <button
        type="submit"
        disabled={rating === 0 || status === "sending"}
        className="flex h-12 items-center justify-center rounded-full bg-menu-accent font-semibold text-menu-on-accent disabled:opacity-50"
      >
        {text.send}
      </button>
    </form>
  );
}
```

> Uygulayıcı notu: `useMemo` erken `return`'den (teşekkür ekranı) önce çağrılmalı (hook kuralı) — `t` tanımını `if (status === "sent")` satırının üstüne taşı. Renk sınıfı adlarını (`bg-menu-accent`, `text-menu-on-accent` vb.) `components/menu/menu-style.tsx`'teki gerçek CSS değişkenlerinden doğrula; olmayan sınıf kullanma.

`provider.tsx`:

```tsx
const FeedbackForm = dynamic(() => import("./feedback-form"), { ssr: false });
```

`searchLoaded` gibi `const [feedbackLoaded, setFeedbackLoaded] = useState(false);` ve `open` içinde `if (next.type === "feedback") setFeedbackLoaded(true);`. LanguagePanel Sheet'inden sonra:

```tsx
{
  feedbackLoaded && data.feedbackBranchId && (
    <Sheet
      open={panel?.type === "feedback"}
      onClose={close}
      label={data.text.rateUs}
      closeLabel={data.text.close}
    >
      <FeedbackForm data={data} branchId={data.feedbackBranchId} />
    </Sheet>
  );
}
```

(İlk açılışta Sheet, `open` true iken mount olur; `Sheet`'in effect'i mount'ta `showModal` çağırır — davranışı tarayıcıda doğrula.)

- [ ] **Step 4: Butonlar.** `islands.tsx` sonuna:

```tsx
/** "Bizi değerlendirin": paket içeriyorsa görünür, formu açar. */
export function FeedbackButton({ className }: { className: string }) {
  const { open, data } = useMenu();
  if (!data.feedbackBranchId) return null;
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      className={className}
      onClick={() => open({ type: "feedback" })}
    >
      {data.text.rateUs}
    </button>
  );
}
```

`themes/index.tsx`: `<MenuProvider>` içine, `<Theme …/>`'dan sonra butonu ortalı bir blokta koy (altbilgi Provider dışında olduğu için):

```tsx
<div className="flex justify-center bg-menu-bg pt-6">
  <FeedbackButton className="flex h-11 items-center gap-2 rounded-full border border-menu-line px-5 text-sm font-semibold" />
</div>
```

`info-panel.tsx`: alerjen PDF bağlantısından sonra `FeedbackButton` (aynı satır stiliyle: `flex min-h-11 items-center gap-3 font-semibold text-menu-accent-text`) — `InfoPanel` provider içinde render edildiği için `useMenu` çalışır.

- [ ] **Step 5: Doğrula.** `npm run typecheck`, `npx vitest run`. Menü JS bütçesi: `rm -rf .next && npm run build`, sonra derleme çıktısında menü sayfasının ilk yükünü değişiklik öncesiyle karşılaştır (form ayrı parçada olmalı). Yerel dev sunucusunda: paket kapalıyken buton yok; Standart'ta açınca (Task 1 kutusu) var, form gönderilir, `docker compose exec -T db psql -U qrmenu -d qrmenu -c 'select rating,message,language from "Feedback"'` satırı gösterir.

---

### Task 5: Panel sayfası, silme, okunmamış rozeti

**Files:**

- Create: `lib/feedback.ts` (sorgular)
- Create: `actions/feedback-admin.ts` (`deleteFeedback`) — `actions/feedback.ts` oturumsuz kalsın diye ayrı
- Create: `app/(panel)/panel/feedback/page.tsx`
- Modify: `app/(panel)/panel/_components/panel-nav.tsx` (ikon + rozet)
- Modify: `app/(panel)/panel/layout.tsx` (öğe + sayı)
- Modify: `lib/ownership.ts` (`assertFeedbackBelongsToBusiness`)
- Test: `lib/ownership.test.ts` (mevcut desenle ekleme)

**Interfaces:**

- Consumes: `canUseFeedback`, `db.feedback`.
- Produces: `getFeedbackSummary(branchIds: string[]): Promise<{ total: number; average: number | null; counts: Record<1|2|3|4|5, number> }>`; `listFeedback(branchIds: string[], page: number): Promise<{ items: FeedbackRow[]; hasMore: boolean }>`; `countUnreadFeedback(businessId: string): Promise<number>`; `deleteFeedback(input: unknown): Promise<ActionResult<null>>`.

- [ ] **Step 1: Ownership testi** — `lib/ownership.test.ts`'teki mevcut `assertCampaignBelongsToBusiness` testlerinin desenini kopyala (aynı mock yapısı): başka işletmenin değerlendirmesi `ActionError` fırlatır; kendi işletmesininki `{ id, branchId }` döner. Çalıştır → FAIL.

- [ ] **Step 2: Implement.**

`lib/ownership.ts` (campaign fonksiyonunun desenini izle):

```ts
export async function assertFeedbackBelongsToBusiness(
  feedbackId: string,
  businessId: string,
) {
  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, branch: { businessId, deletedAt: null } },
    select: { id: true, branchId: true },
  });
  if (!feedback) throw new ActionError("Değerlendirme bulunamadı.");
  return feedback;
}
```

`lib/feedback.ts`:

```ts
import "server-only";
import { db } from "@/lib/db";

export const FEEDBACK_PAGE_SIZE = 50;

export async function getFeedbackSummary(branchIds: string[]) {
  const rows = await db.feedback.groupBy({
    by: ["rating"],
    where: { branchId: { in: branchIds } },
    _count: { _all: true },
  });
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  let total = 0;
  let sum = 0;
  for (const r of rows) {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    counts[rating] = r._count._all;
    total += r._count._all;
    sum += rating * r._count._all;
  }
  return { total, average: total ? sum / total : null, counts };
}

export async function listFeedback(branchIds: string[], page: number) {
  const rows = await db.feedback.findMany({
    where: { branchId: { in: branchIds } },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * FEEDBACK_PAGE_SIZE,
    take: FEEDBACK_PAGE_SIZE + 1,
    select: {
      id: true,
      rating: true,
      message: true,
      language: true,
      createdAt: true,
      readAt: true,
      branch: { select: { name: true } },
    },
  });
  return {
    items: rows.slice(0, FEEDBACK_PAGE_SIZE),
    hasMore: rows.length > FEEDBACK_PAGE_SIZE,
  };
}
export type FeedbackRow = Awaited<
  ReturnType<typeof listFeedback>
>["items"][number];

export function countUnreadFeedback(businessId: string) {
  return db.feedback.count({
    where: { readAt: null, branch: { businessId, deletedAt: null } },
  });
}
```

`actions/feedback-admin.ts`:

```ts
"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, toActionError } from "@/lib/action";
import { db } from "@/lib/db";
import { assertFeedbackBelongsToBusiness } from "@/lib/ownership";
import { requireWritableSession } from "@/lib/session";
import { firstError, id } from "@/lib/validations/common";

/** İşletme sahibi bir değerlendirmeyi kalıcı olarak siler. */
export async function deleteFeedback(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const session = await requireWritableSession();
    if (session.user.role !== "OWNER")
      return { ok: false, error: "Bu işlem için yetkiniz yok." };
    const parsed = z.object({ feedbackId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const feedback = await assertFeedbackBelongsToBusiness(
      parsed.data.feedbackId,
      session.businessId,
    );
    await db.feedback.delete({ where: { id: feedback.id } });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
```

`app/(panel)/panel/feedback/page.tsx` — yapı `stats/page.tsx`'i izler (`requireOwnerSession`, `getBusinessContext`, şubeler, kilit kartı, şube yoksa boş durum, `StatsBranchSelect` yeniden kullanılır — `?branch=`). İçerik:

- `PageHeader title="Değerlendirmeler" description="Müşterilerinizin menüden bıraktığı puan ve mesajlar."`
- Paket kapalıysa kilit kartı: "Paketiniz müşteri değerlendirmelerini içermiyor." + istatistikteki yükseltme metni.
- Özet kartı: ortalama (`average.toFixed(1)` + "/ 5"), toplam, 5→1 yıldız sayıları (basit çubuk: `BarList` `@/components/panel/stats`'ten, etiket "5 yıldız" …).
- Liste: her satırda yıldızlar (`StarIcon` dolu/boş, `aria-label="{n} yıldız"`), mesaj (yoksa "Mesaj yok" soluk), `formatDate(createdAt)`, şube adı (birden çok şube varsa), dil (`getLanguage(language).native`), `readAt === null` ise "Yeni" rozeti, `ConfirmButton destructive title="Değerlendirme silinsin mi?" description="Bu değerlendirme kalıcı olarak silinir." confirmLabel="Sil" successMessage="Değerlendirme silindi." onConfirm={deleteFeedback.bind(null, { feedbackId: f.id })}`.
- Boş durum: "Henüz değerlendirme yok. Müşterileriniz menüdeki “Bizi değerlendirin” butonuyla puan bırakabilir."
- Sayfalama: `?page=` (1'den küçük/sayı değilse 1); `hasMore` ise "Daha eski" bağlantısı, `page > 1` ise "Daha yeni".
- Okundu: görüntülenen okunmamışlar yanıttan sonra işaretlenir —
  ```ts
  const unreadIds = items.filter((f) => !f.readAt).map((f) => f.id);
  if (unreadIds.length && !viewOnly)
    after(() =>
      db.feedback.updateMany({
        where: { id: { in: unreadIds }, readAt: null },
        data: { readAt: new Date() },
      }),
    );
  ```
  (`viewOnly`: süper admin "işletmenin gözünden bak" modunda okundu işaretlenmez.)

`panel-nav.tsx`: `ICONS`'a `feedback: MessageSquareIcon` (lucide). `NavItem`'a `badge?: number`. Kenar menüsünde etiketin yanına:

```tsx
{
  badge ? (
    <span className="ms-auto rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
      {badge > 99 ? "99+" : badge}
    </span>
  ) : null;
}
```

Alt menüde (telefon) aynı rozet, sekme etiketinin yanında küçük. `layout.tsx`: sahip için, paket `canUseFeedback` ise `countUnreadFeedback(businessId)` ile `{ href: "/panel/feedback", label: "Değerlendirmeler", icon: "feedback", badge }` öğesini "İstatistikler"den sonra ekle. Paket kapalıysa öğe gösterilmez (sayfa yine kilit kartı gösterir).

- [ ] **Step 3:** `npx vitest run`, `npm run typecheck`, eslint → temiz.

---

### Task 6: KVKK, karar kaydı, uçtan uca test, rapor

**Files:**

- Modify: `app/(legal)/kvkk/page.tsx` (bölüm 1'e paragraf)
- Modify: `docs/KARARLAR.md` (satır)
- Create: `e2e/feedback.e2e.ts`
- Create: `raporlar/28-musteri-degerlendirmeleri.md`

- [ ] **Step 1: KVKK.** Bölüm 1 paragrafından sonra:

```tsx
<p>
  İşletmenin paketi içeriyorsa ziyaretçi menüden isteğe bağlı olarak{" "}
  <strong>anonim bir değerlendirme</strong> (1–5 puan ve kısa bir mesaj)
  bırakabilir. Ad, telefon veya e-posta istenmez ve IP adresi saklanmaz. Mesaj
  serbest metindir; kişisel bilgi yazılmaması istenir. Değerlendirmeyi yalnızca
  ilgili işletme görür ve silebilir; şube silindiğinde değerlendirmeleri de
  silinir.
</p>
```

- [ ] **Step 2: KARARLAR.md** — mevcut tablo biçiminde satır: tarih 2026-11-19; konu "Müşteri değerlendirmeleri"; karar "Anonim 1–5 puan + 500 karakter mesaj, yalnızca işletme panelinde; paket ayarıyla açılır (varsayılan kapalı); IP saklanmaz, saatte 5 sınırı"; gerekçe "Kullanıcı isteği; kaynaklarda yok. KURALLAR 7/13 (kişisel veri yok) korunur."

- [ ] **Step 3: E2E** — `e2e/feedback.e2e.ts` (Standart paketini yönetimden açar, menüden gönderir, panelde görür, siler; sonunda paketi eski hâline getirir):

```ts
import { expect, test } from "@playwright/test";
import { MENU_PATH, OWNER, seedPassword, signIn, signInAs } from "./helpers";

const ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@qrmenu.local";

async function setFeedback(page: import("@playwright/test").Page, on: boolean) {
  await signIn(page, ADMIN, seedPassword());
  await page.goto("/admin/plans");
  await page.getByRole("link", { name: "Standart" }).first().click();
  const box = page.getByLabel("Müşteri değerlendirmeleri");
  if ((await box.isChecked()) !== on) await box.click();
  await page.getByRole("button", { name: "Kaydet" }).click();
  await expect(page.getByText(/kaydedildi/i)).toBeVisible();
  await page.context().clearCookies();
}

test.describe.serial("müşteri değerlendirmeleri", () => {
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await setFeedback(page, false);
    await page.close();
  });

  test("paket kapalıyken menüde buton yok", async ({ page }) => {
    await setFeedback(page, false);
    await page.goto(MENU_PATH);
    await expect(
      page.getByRole("button", { name: "Bizi değerlendirin" }),
    ).toHaveCount(0);
  });

  test("menüden gönderilen değerlendirme panelde görünür ve silinir", async ({
    page,
  }) => {
    await setFeedback(page, true);
    await page.goto(MENU_PATH);
    await page
      .getByRole("button", { name: "Bizi değerlendirin" })
      .first()
      .click();
    await page.getByText("4 yıldız").click();
    const text = `E2E ${Date.now()}`;
    await page.getByLabel("Mesajınız (isteğe bağlı)").fill(text);
    await page.getByRole("button", { name: "Gönder" }).click();
    await expect(
      page.getByText("Teşekkürler! Değerlendirmeniz iletildi."),
    ).toBeVisible();

    await signInAs(page, OWNER);
    await page.goto("/panel/feedback");
    await expect(page.getByText(text)).toBeVisible();
    const row = page.getByRole("listitem").filter({ hasText: text });
    await row.getByRole("button", { name: "Sil" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Sil" })
      .click();
    await expect(page.getByText("Değerlendirme silindi.")).toBeVisible();
    await expect(page.getByText(text)).toHaveCount(0);
  });
});
```

(Seçicileri gerçek admin paket sayfasına göre ayarla: `app/(admin)/admin/plans/` altındaki liste ve form başarı mesajını oku. Menü sayfası 1 saatlik önbellekli; `savePlan`'daki `expireBusinessMenus` (Task 1) butonun hemen görünmesini sağlar — test bunu da doğrular.)

- [ ] **Step 4: Tam doğrulama.** `npx vitest run`; `npm run typecheck`; `npx eslint .`; `rm -rf .next && npm run build`; yerel sunucu `node .next/standalone/server.js` yerine `npm run start` ile Playwright (`npx playwright test`) → hepsi geçer.

- [ ] **Step 5: Rapor** — `raporlar/28-musteri-degerlendirmeleri.md`: ne yapıldı, kaynaktaki karşılığı (yok; KARARLAR satırı), migration SQL'inin tamamı (yalnızca CREATE), test sonuçları, yayın notu: deploy öncesi taze yedek + R2 kopyası, push için kullanıcı onayı, bellek ölçümünden (21–22.11) sonra.

- [ ] **Step 6: Kullanıcıya özet ve push onayı sor.** Commit/push yapma.
