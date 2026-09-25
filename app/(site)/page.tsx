import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { readPlanFeatures } from "@/lib/plan-features";
import { accountRequestMailto } from "@/lib/site";
import { APPEARANCE_OPTIONS, STATS_OPTIONS } from "@/lib/validations/plan";

export const metadata: Metadata = {
  title: "QR Menü: kafe ve restoranlar için dijital menü",
  description:
    "Menünüzü panelden yönetin, müşterileriniz masadaki QR kodu okutarak açsın. Alerjen tablosu, basılı menü ve çoklu dil hazır.",
};

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
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pt-12 pb-16 md:grid-cols-[1fr_auto] md:gap-16 md:pt-20">
        <div className="flex max-w-xl flex-col gap-6">
          <h1 className="font-site-display text-4xl leading-tight text-balance sm:text-5xl lg:text-6xl">
            Menünüz, masadaki QR kodda.
          </h1>
          <p className="text-lg leading-relaxed text-site-muted">
            Kafe ve restoranlar için dijital menü. Fiyatı panelden
            değiştirirsiniz, menü o an güncellenir; QR kodu yeniden bastırmanız
            gerekmez.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={accountRequestMailto}
              className="rounded-full bg-site-green px-6 py-3 font-medium text-white hover:bg-site-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-site-green"
            >
              Hesap talep edin
            </a>
            <Link
              href="/demo"
              className="rounded-full border border-site-line px-6 py-3 font-medium hover:border-site-ink"
            >
              Örnek menüyü açın
            </Link>
          </div>
          <p className="text-sm text-site-muted">
            Müşterileriniz uygulama indirmez, üye olmaz.
          </p>
        </div>

        {/* Gerçek örnek menü; dokunarak denenebilir. */}
        <figure className="mx-auto flex flex-col items-center gap-3">
          <div className="relative rounded-4xl bg-site-ink p-2.5 shadow-xl ring-1 ring-site-ink/10">
            <iframe
              src="/demo"
              title="Örnek menü: kategorilere ve ürünlere dokunarak deneyin"
              className="h-150 w-72 rounded-3xl bg-white sm:h-160 sm:w-80"
            />
          </div>
          <figcaption className="flex items-center gap-2 text-sm text-site-muted">
            <span
              aria-hidden
              className="inline-block size-2 rounded-full bg-site-lemon ring-2 ring-site-lemon/40"
            />
            Canlı örnek: ürünlere dokunun
          </figcaption>
        </figure>
      </section>

      <section
        id="nasil"
        aria-labelledby="nasil-baslik"
        className="scroll-mt-4 border-y border-site-line bg-site-mist"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16">
          <h2
            id="nasil-baslik"
            className="font-site-display text-3xl sm:text-4xl"
          >
            Dört adımda yayında
          </h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-site-green font-site-display text-lg text-white"
                >
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="leading-relaxed text-site-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="ozellik-baslik"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-16"
      >
        <h2
          id="ozellik-baslik"
          className="max-w-2xl font-site-display text-3xl sm:text-4xl"
        >
          Kâğıt menünün yapamadıkları
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {FEATURES.map((group) => (
            <div key={group.title} className="flex flex-col gap-4">
              <h3 className="border-b-2 border-site-lemon pb-2 text-lg font-semibold">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-3 leading-relaxed text-site-muted">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
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
                className="font-site-display text-3xl sm:text-4xl"
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
                  <h3 className="font-site-display text-2xl">
                    {plan.name}
                    <span className="mt-1 block font-site-body text-base text-site-muted">
                      {plan.price > 0
                        ? formatPrice(plan.price)
                        : "Fiyat için bize yazın"}
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
                        className="px-4 pb-4 align-bottom font-site-display text-2xl font-normal"
                      >
                        {plan.name}
                        <span className="mt-1 block font-site-body text-base text-site-muted">
                          {plan.price > 0
                            ? formatPrice(plan.price)
                            : "Fiyat için bize yazın"}
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
              className="font-site-display text-3xl sm:text-4xl"
            >
              Sık sorulanlar
            </h2>
            <Link
              href="/yardim"
              className="w-fit text-site-green underline underline-offset-4 hover:text-site-ink"
            >
              Tüm yardım konuları
            </Link>
          </div>
          <dl className="flex flex-col gap-6">
            {FAQ.map((item) => (
              <div key={item.q} className="flex flex-col gap-1.5">
                <dt className="font-semibold">{item.q}</dt>
                <dd className="leading-relaxed text-site-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-site-green text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl font-site-display text-3xl leading-snug">
            Menünüzü dijitale taşıyalım.
          </p>
          <a
            href={accountRequestMailto}
            className="rounded-full bg-site-lemon px-6 py-3 font-medium text-site-ink hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Hesap talep edin
          </a>
        </div>
      </section>
    </main>
  );
}
