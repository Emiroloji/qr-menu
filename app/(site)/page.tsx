import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { HeroScene } from "@/components/site/hero-scene";
import { LiveDemo } from "@/components/site/live-demo";
import { ModuleEdge, QrArt } from "@/components/site/qr-art";
import { Steps } from "@/components/site/steps";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { readPlanFeatures } from "@/lib/plan-features";
import { accountRequestMailto } from "@/lib/site";
import { APPEARANCE_OPTIONS, STATS_OPTIONS } from "@/lib/validations/plan";

export const metadata: Metadata = {
  title: "karefix: menü değişir, karekod aynı kalır",
  description:
    "Kafe ve restoranlar için QR menü. Menünüzü panelden yönetin, müşterileriniz masadaki karekodu okutarak açsın. Alerjen tablosu, basılı menü ve çoklu dil hazır.",
};

// Ana ekrandaki karekod gerçektir: okutan örnek menüyü açar.
const DEMO_URL = `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "")}/demo`;

const BUTTON =
  "rounded-lg px-6 py-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

const STEPS = [
  {
    title: "Bize yazın",
    text: "İşletmenizi ve ihtiyacınız olan paketi konuşalım; hesabınızı biz açalım.",
  },
  {
    title: "Şifrenizi belirleyin",
    text: "E-postanıza gelen bağlantıyla panelinize girin.",
  },
  {
    title: "Menünüzü girin",
    text: "Ürünleri, fiyatları, fotoğrafları ve alerjenleri panelden ekleyin ya da Excel'den toplu yükleyin.",
  },
  {
    title: "QR kodu masaya koyun",
    text: "Masa kartı, sticker ve poster şablonlarını indirip bastırın. Menü değişse de QR aynı kalır.",
  },
];

const FEATURES = [
  {
    title: "Müşteriniz görür",
    items: [
      "Fotoğraflı ürünler, boy ve porsiyon fiyatları",
      "Kendi dilinde menü: Türkçe, İngilizce, Almanca, Rusça, Arapça",
      "“Şunu içermesin” alerjen filtresi ve vegan, glutensiz gibi etiketler",
      "Kampanyalar, günün önerisi ve öne çıkan ürünler",
      "Wi-Fi şifresi, adres, çalışma saatleri ve sosyal medya",
    ],
  },
  {
    title: "Siz yönetirsiniz",
    items: [
      "Biten ürünü tek dokunuşla “tükendi” yapma",
      "Tüm fiyatlara tek seferde zam veya indirim",
      "Her şubeye ayrı menü ve fiyat",
      "Kahvaltı gibi yalnızca belirli saatlerde görünen kategoriler",
      "Çalışanlara yalnızca izin verdiğiniz işler",
      "Menünün kaç kez açıldığı ve en çok bakılan ürünler",
    ],
  },
  {
    title: "Yasal yükümlülükler",
    items: [
      "Yasal 14 alerjen, “içerir” ve “iz miktarda içerebilir” ayrımıyla",
      "Tüm ürünlerin alerjen tablosu (PDF), müşteri menüden de indirebilir",
      "Fiyatlı, yazdırılabilir basılı menü (PDF)",
      "Müşteriden üyelik, çerez veya kişisel veri istenmez",
    ],
  },
];

const FAQ = [
  {
    q: "Müşterinin uygulama indirmesi gerekir mi?",
    a: "Hayır. Telefon kamerasıyla QR kodu okutması yeterli; menü tarayıcıda açılır.",
  },
  {
    q: "Fiyat değişince QR kodu yeniden bastırmam gerekir mi?",
    a: "Hayır. QR kod menünüzün adresini gösterir; paneldeki her değişiklik menüde hemen görünür.",
  },
  {
    q: "Menüden sipariş alınabiliyor mu?",
    a: "Hayır, sistem yalnızca menüyü göstermek içindir. Müşteri siparişini her zamanki gibi garsona verir.",
  },
  {
    q: "Birden fazla şubem var, her birine ayrı menü olur mu?",
    a: "Evet. Her şubenin kendi menüsü, fiyatları ve QR kodu olur; menüyü bir şubeden diğerine kopyalayabilirsiniz.",
  },
];

const limit = (value: number | null, unit: string) =>
  value === null ? "Sınırsız" : `${value} ${unit}`;

export default async function HomePage() {
  // Paketler veritabanından okunur; sayfa derleme sırasında değil istekte üretilir.
  await connection();
  const plans = (await db.plan.findMany({ where: { isActive: true } })).sort(
    (a, b) =>
      (a.maxProducts ?? Infinity) - (b.maxProducts ?? Infinity) ||
      a.price - b.price,
  );
  const rows: [string, (p: (typeof plans)[number]) => string][] = [
    ["Şube", (p) => limit(p.maxBranches, "şube")],
    ["Ürün", (p) => limit(p.maxProducts, "ürün")],
    ["Çalışan", (p) => limit(p.maxStaff, "çalışan")],
    ["Dil", (p) => limit(p.maxLanguages, "dil")],
    [
      "Görünüm",
      (p) => APPEARANCE_OPTIONS[readPlanFeatures(p.features).appearance],
    ],
    ["İstatistik", (p) => STATS_OPTIONS[readPlanFeatures(p.features).stats]],
    [
      "Kendi alan adınız",
      (p) => (readPlanFeatures(p.features).customDomain ? "Var" : "Yok"),
    ],
  ];

  return (
    <main className="flex flex-col">
      <section className="bg-site-lemon">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-10 pb-14 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pt-16 lg:pb-20">
          <div className="flex max-w-xl flex-col gap-6">
            <h1 className="site-rise font-site-display text-5xl leading-[0.98] font-extrabold tracking-tight text-balance sm:text-6xl xl:text-7xl">
              Menü değişir, karekod aynı kalır.
            </h1>
            <p
              className="site-rise max-w-lg text-lg leading-relaxed text-site-ink/80"
              style={{ animationDelay: "120ms" }}
            >
              karefix, kafe ve restoranlar için QR menü. Fiyatı panelden
              değiştirirsiniz, menü o an güncellenir; masadaki karekodu yeniden
              bastırmazsınız.
            </p>
            <div
              className="site-rise flex flex-wrap gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <a
                href={accountRequestMailto}
                className={`${BUTTON} bg-site-ink text-white hover:bg-site-green focus-visible:outline-site-ink`}
              >
                Hesap talep edin
              </a>
              <Link
                href="/demo"
                className={`${BUTTON} border-2 border-site-ink hover:bg-site-ink hover:text-white focus-visible:outline-site-ink`}
              >
                Örnek menüyü açın
              </Link>
            </div>
            <p
              className="site-rise text-sm text-site-ink/70"
              style={{ animationDelay: "360ms" }}
            >
              Müşterileriniz uygulama indirmez, üye olmaz.
            </p>
          </div>

          <figure className="flex flex-col items-center gap-5">
            <HeroScene
              qr={<QrArt value={DEMO_URL} animated className="w-full" />}
            />
            <figcaption className="max-w-sm text-center text-sm text-site-ink/75">
              Üç değişiklik, tek karekod. Bu karekod gerçek: telefonunuzla
              okutun, örnek menü açılsın.
            </figcaption>
          </figure>
        </div>
      </section>
      <ModuleEdge className="-mt-px text-site-lemon" />

      <section
        id="nasil"
        aria-labelledby="nasil-baslik"
        className="mx-auto flex w-full max-w-6xl scroll-mt-4 flex-col gap-10 px-5 py-16"
      >
        <h2
          id="nasil-baslik"
          className="font-site-display text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Dört adımda yayında
        </h2>
        <Steps steps={STEPS} />
      </section>

      <section
        aria-labelledby="deneyin-baslik"
        className="border-y border-site-line bg-site-mist"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="flex max-w-lg flex-col gap-5">
            <h2
              id="deneyin-baslik"
              className="font-site-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Müşterinizin göreceği menü
            </h2>
            <p className="text-lg leading-relaxed text-site-muted">
              Yandaki telefon bir resim değil, çalışan bir menü. Kategorilere ve
              ürünlere dokunun, arama ve alerjen filtresini deneyin.
            </p>
            <ul className="flex flex-col gap-2.5 text-site-muted">
              {[
                "Dört hazır tema, işletmenizin rengi ve logosu",
                "Uygulama gerekmez; telefonun kamerası yeter",
                "Yavaş internette de hızlı açılır",
              ].map((item) => (
                <li key={item} className="flex items-baseline gap-3">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 translate-y-[-1px] rounded-[3px] bg-site-green"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/demo"
              className="w-fit font-semibold text-site-green underline decoration-2 underline-offset-4 hover:text-site-ink"
            >
              Tam ekranda açın ve temaları deneyin
            </Link>
          </div>
          {/* Gerçek örnek menü; dokunarak denenebilir. */}
          <LiveDemo>
            <QrArt value={DEMO_URL} className="w-full" />
          </LiveDemo>
        </div>
      </section>

      <section
        aria-labelledby="ozellik-baslik"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16"
      >
        <h2
          id="ozellik-baslik"
          className="max-w-2xl font-site-display text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Kâğıt menünün yapamadıkları
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {FEATURES.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="w-fit bg-site-lemon px-2 py-1 font-site-display text-xl font-bold">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-3 leading-relaxed text-site-muted">
                {group.items.map((item) => (
                  <li key={item} className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 translate-y-[-2px] rounded-[2px] bg-site-ink"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {plans.length > 0 && (
        <section
          id="paketler"
          aria-labelledby="paket-baslik"
          className="scroll-mt-4 border-t border-site-line"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16">
            <div className="flex flex-col gap-3">
              <h2
                id="paket-baslik"
                className="font-site-display text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Paketler
              </h2>
              <p className="max-w-2xl text-site-muted">
                İhtiyacınıza göre başlayın; paketinizi sonra
                değiştirebilirsiniz.
              </p>
            </div>
            {/* Telefonda paketler alt alta; geniş ekranda karşılaştırma tablosu. */}
            <div className="flex flex-col gap-8 sm:hidden">
              {plans.map((plan) => (
                <div key={plan.id} className="flex flex-col gap-3">
                  <h3 className="font-site-display text-2xl font-bold">
                    {plan.name}
                    <span className="mt-1 block font-site-body text-base font-normal text-site-muted">
                      {plan.price > 0 ? formatPrice(plan.price) : "Ücretsiz"}
                    </span>
                  </h3>
                  <dl className="grid grid-cols-2 border-t border-site-line">
                    {rows.map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="border-b border-site-line py-2.5 text-site-muted">
                          {label}
                        </dt>
                        <dd className="border-b border-site-line py-2.5">
                          {value(plan)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Paketlerin karşılaştırması
                </caption>
                <thead>
                  <tr>
                    <td className="w-40" />
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        scope="col"
                        className="px-4 pb-4 align-bottom font-site-display text-2xl font-bold"
                      >
                        {plan.name}
                        <span className="mt-1 block font-site-body text-base font-normal text-site-muted">
                          {plan.price > 0
                            ? formatPrice(plan.price)
                            : "Ücretsiz"}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, value]) => (
                    <tr key={label} className="border-t border-site-line">
                      <th
                        scope="row"
                        className="py-3 pr-4 font-medium text-site-muted"
                      >
                        {label}
                      </th>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3">
                          {value(plan)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section
        aria-labelledby="sss-baslik"
        className="border-t border-site-line bg-site-mist"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-3">
            <h2
              id="sss-baslik"
              className="font-site-display text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Sık sorulanlar
            </h2>
            <Link
              href="/yardim"
              className="w-fit font-semibold text-site-green underline decoration-2 underline-offset-4 hover:text-site-ink"
            >
              Tüm yardım konuları
            </Link>
          </div>
          <div className="flex flex-col border-t-2 border-site-ink">
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                open={i === 0}
                className="group border-b border-site-line"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-green [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden
                    className="relative size-6 shrink-0 rounded-md bg-site-ink transition-transform duration-300 group-open:rotate-45 group-open:bg-site-green"
                  >
                    <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 bg-white" />
                    <span className="absolute inset-y-1.5 left-1/2 w-0.5 -translate-x-1/2 bg-white" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 leading-relaxed text-site-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-site-green text-white">
        <QrArt
          value={DEMO_URL}
          className="pointer-events-none absolute -top-10 -right-10 w-72 text-site-lemon opacity-15 sm:w-96"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl font-site-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Menünüzü karekoda taşıyalım.
          </p>
          <a
            href={accountRequestMailto}
            className={`${BUTTON} bg-site-lemon text-site-ink hover:bg-white focus-visible:outline-white`}
          >
            Hesap talep edin
          </a>
        </div>
      </section>
    </main>
  );
}
