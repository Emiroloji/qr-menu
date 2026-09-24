import "server-only";
import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { MenuCategory } from "@/components/menu/types";
import { PDF_FONT } from "./fonts";

export type AllergenDocumentData = {
  lang: string;
  businessName: string;
  branchName: string;
  accentText: string;
  /** Yasal sırayla 14 alerjen (seçilen dilde) */
  allergens: { code: string; name: string }[];
  categories: MenuCategory[];
  text: {
    title: string;
    product: string;
    contains: string;
    mayContain: string;
    note: string;
    generatedOn: string;
  };
};

const COL = 36; // alerjen sütunu genişliği (pt); en uzun ad "Yumuşakçalar" sığmalı
const INK = "#111111";
const MUTED = "#555555";
const LINE = "#D4D4D4";

const s = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    fontSize: 8.5,
    color: INK,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
    minHeight: 18,
  },
  name: { flex: 1, paddingVertical: 3, paddingRight: 6 },
  cell: { width: COL, alignItems: "center", justifyContent: "center" },
  box: { width: 9, height: 9, borderRadius: 1.5 },
});

function Mark({ level }: { level?: "CONTAINS" | "MAY_CONTAIN" }) {
  if (level === "CONTAINS")
    return <View style={[s.box, { backgroundColor: INK }]} />;
  if (level === "MAY_CONTAIN")
    return <View style={[s.box, { borderWidth: 1, borderColor: INK }]} />;
  return null;
}

function AllergenDocument({ data }: { data: AllergenDocumentData }) {
  return (
    <Document
      title={`${data.businessName} · ${data.text.title}`}
      author={data.businessName}
      language={data.lang}
    >
      <Page size="A4" orientation="landscape" style={s.page}>
        <View
          fixed
          style={{
            marginBottom: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={{ fontSize: 16, fontWeight: 700 }}>
              {data.text.title}
            </Text>
            <Text style={{ fontSize: 10, color: MUTED }}>
              {data.businessName} · {data.branchName}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <Mark level="CONTAINS" />
              <Text>{data.text.contains}</Text>
            </View>
            <View
              style={{ flexDirection: "row", gap: 4, alignItems: "center" }}
            >
              <Mark level="MAY_CONTAIN" />
              <Text>{data.text.mayContain}</Text>
            </View>
          </View>
        </View>

        {/* Sütun başlıkları: numara + ad (her sayfada tekrarlanır) */}
        <View
          fixed
          style={[
            s.row,
            {
              borderBottomWidth: 1,
              borderBottomColor: INK,
              alignItems: "flex-end",
            },
          ]}
        >
          <Text style={[s.name, { fontWeight: 700 }]}>{data.text.product}</Text>
          {data.allergens.map((a, i) => (
            <View key={a.code} style={[s.cell, { paddingBottom: 3 }]}>
              <Text style={{ fontWeight: 700 }}>{i + 1}</Text>
              <Text style={{ fontSize: 5, color: MUTED, textAlign: "center" }}>
                {a.name}
              </Text>
            </View>
          ))}
        </View>

        {data.categories.map((category) => (
          <View key={category.id}>
            <View wrap={false} style={[s.row, { backgroundColor: "#F4F4F4" }]}>
              <Text
                style={[s.name, { fontWeight: 700, color: data.accentText }]}
              >
                {category.name}
              </Text>
            </View>
            {category.products.map((product) => {
              const levels = new Map(
                product.allergens.map((a) => [a.code, a.level]),
              );
              return (
                <View key={product.id} wrap={false} style={s.row}>
                  <Text style={s.name}>{product.name}</Text>
                  {data.allergens.map((a) => (
                    <View key={a.code} style={s.cell}>
                      <Mark level={levels.get(a.code)} />
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ marginTop: 12, gap: 2 }}>
          <Text style={{ color: MUTED }}>{data.text.note}</Text>
          <Text style={{ color: MUTED }}>{data.text.generatedOn}</Text>
        </View>
        <Text
          fixed
          style={{
            position: "absolute",
            bottom: 18,
            right: 28,
            fontSize: 8,
            color: MUTED,
          }}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export function renderAllergenPdf(data: AllergenDocumentData) {
  return renderToBuffer(<AllergenDocument data={data} />);
}
