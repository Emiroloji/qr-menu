/* eslint-disable jsx-a11y/alt-text -- react-pdf Image bir PDF öğesidir, HTML img değildir; alt özelliği yoktur. */
import "server-only";
import {
  Document,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { PDF_FONT } from "./fonts";

export type QrTemplateData = {
  businessName: string;
  branchName: string;
  url: string;
  /** Ekrandaki gösterim için şemasız adres, ör. qrmenu.com/limon-kafe/kadikoy */
  displayUrl: string;
  qr: Buffer;
  logo: Buffer | null;
  accent: string;
  onAccent: string;
  /** Beyaz kâğıtta okunur vurgu rengi (en az 4.5:1) */
  accentText: string;
  /** "Menüyü görmek için QR kodu okutun" ve şubenin diğer dillerindeki karşılıkları */
  instructions: string[];
  wifi: string | null;
};

export const QR_TEMPLATES = {
  "table-card": {
    label: "Masa kartı",
    description: "A6 (10,5 × 14,8 cm), masaya dik konan kart",
  },
  sticker: {
    label: "Sticker",
    description: "A4 sayfada 12 adet 6 × 6 cm, kesim çizgili",
  },
  poster: { label: "A4 poster", description: "Giriş, vitrin veya duvar için" },
} as const;
export type QrTemplate = keyof typeof QR_TEMPLATES;

const mm = (value: number) => value * 2.8346;

const base = StyleSheet.create({
  page: { fontFamily: PDF_FONT, color: "#111111", backgroundColor: "#FFFFFF" },
  center: { alignItems: "center" },
});

/** Logo; yoksa baş harf dairesi. `onAccent`: vurgu renkli zemin üzerinde (ters renk). */
function Brand({
  data,
  size,
  onAccent = false,
}: {
  data: QrTemplateData;
  size: number;
  onAccent?: boolean;
}) {
  return data.logo ? (
    <Image
      src={{ data: data.logo, format: "png" }}
      style={{ width: mm(size), height: mm(size), objectFit: "contain" }}
    />
  ) : (
    <View
      style={{
        width: mm(size),
        height: mm(size),
        borderRadius: mm(size / 2),
        backgroundColor: onAccent ? data.onAccent : data.accent,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: onAccent ? data.accent : data.onAccent,
          fontSize: mm(size * 0.45),
          fontWeight: 700,
        }}
      >
        {data.businessName.charAt(0)}
      </Text>
    </View>
  );
}

function Instructions({ lines, size }: { lines: string[]; size: number }) {
  return (
    <View style={{ ...base.center, gap: mm(1) }}>
      {lines.map((line, i) => (
        <Text
          key={line}
          style={{
            fontSize: i === 0 ? size : size * 0.72,
            fontWeight: i === 0 ? 600 : 400,
            color: i === 0 ? "#111111" : "#555555",
            textAlign: "center",
          }}
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

function TableCard({ data }: { data: QrTemplateData }) {
  return (
    <Page size="A6" style={base.page}>
      <View style={{ backgroundColor: data.accent, height: mm(5) }} />
      <View
        style={{
          flex: 1,
          ...base.center,
          justifyContent: "space-between",
          padding: mm(7),
        }}
      >
        <View style={{ ...base.center, gap: mm(2) }}>
          <Brand data={data} size={14} />
          <Text style={{ fontSize: 15, fontWeight: 700, textAlign: "center" }}>
            {data.businessName}
          </Text>
        </View>
        <Image
          src={{ data: data.qr, format: "png" }}
          style={{ width: mm(62), height: mm(62) }}
        />
        <Instructions lines={data.instructions} size={10} />
        <Text style={{ fontSize: 7.5, color: "#555555", textAlign: "center" }}>
          {data.branchName}
          {data.wifi ? `  ·  Wi-Fi: ${data.wifi}` : ""}
        </Text>
      </View>
    </Page>
  );
}

function StickerSheet({ data }: { data: QrTemplateData }) {
  const size = 60;
  return (
    <Page
      size="A4"
      style={{ ...base.page, padding: mm(15), paddingTop: mm(18) }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: mm(0) }}>
        {Array.from({ length: 12 }, (_, i) => (
          <View
            key={i}
            style={{
              width: mm(size),
              height: mm(size),
              borderWidth: 0.5,
              borderColor: "#CCCCCC",
              borderStyle: "dashed",
              ...base.center,
              justifyContent: "center",
              gap: mm(1.5),
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: data.accentText,
              }}
            >
              MENÜ
            </Text>
            <Image
              src={{ data: data.qr, format: "png" }}
              style={{ width: mm(40), height: mm(40) }}
            />
            <Text
              style={{
                fontSize: 6.5,
                color: "#333333",
                maxWidth: mm(52),
                textAlign: "center",
              }}
            >
              {data.businessName}
            </Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          position: "absolute",
          bottom: mm(10),
          left: mm(15),
          fontSize: 7,
          color: "#888888",
        }}
      >
        Kesik çizgilerden kesin. {data.displayUrl}
      </Text>
    </Page>
  );
}

function Poster({ data }: { data: QrTemplateData }) {
  return (
    <Page size="A4" style={base.page}>
      <View
        style={{
          backgroundColor: data.accent,
          paddingVertical: mm(14),
          paddingHorizontal: mm(18),
          ...base.center,
          gap: mm(4),
        }}
      >
        <Brand data={data} size={22} onAccent />
        <Text
          style={{
            color: data.onAccent,
            fontSize: 30,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {data.businessName}
        </Text>
        <Text style={{ color: data.onAccent, fontSize: 13 }}>
          {data.branchName}
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          ...base.center,
          justifyContent: "center",
          gap: mm(8),
          padding: mm(18),
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: 700, textAlign: "center" }}>
          Menümüz telefonunuzda
        </Text>
        <Image
          src={{ data: data.qr, format: "png" }}
          style={{ width: mm(105), height: mm(105) }}
        />
        <Instructions lines={data.instructions} size={15} />
      </View>
      <View style={{ ...base.center, paddingBottom: mm(12), gap: mm(1.5) }}>
        {data.wifi && (
          <Text style={{ fontSize: 11, color: "#333333" }}>
            Wi-Fi: {data.wifi}
          </Text>
        )}
        <Text style={{ fontSize: 9, color: "#666666" }}>{data.displayUrl}</Text>
      </View>
    </Page>
  );
}

function QrDocument({
  template,
  data,
}: {
  template: QrTemplate;
  data: QrTemplateData;
}) {
  const Template = {
    "table-card": TableCard,
    sticker: StickerSheet,
    poster: Poster,
  }[template];
  return (
    <Document
      title={`${data.businessName} · ${QR_TEMPLATES[template].label}`}
      author={data.businessName}
      language="tr"
    >
      <Template data={data} />
    </Document>
  );
}

export function renderQrPdf(template: QrTemplate, data: QrTemplateData) {
  return renderToBuffer(<QrDocument template={template} data={data} />);
}
