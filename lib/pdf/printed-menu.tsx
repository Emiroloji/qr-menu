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
import type { MenuCategory } from "@/components/menu/types";
import { formatPriceText } from "@/lib/format";
import { PDF_FONT } from "./fonts";

export type PrintedMenuData = {
  lang: string;
  businessName: string;
  branchName: string;
  logo: Buffer | null;
  qr: Buffer;
  displayUrl: string;
  accent: string;
  onAccent: string;
  accentText: string;
  allergens: { code: string; name: string }[];
  categories: MenuCategory[];
  text: { allergens: string; note: string; scan: string };
};

const MUTED = "#555555";

const s = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT,
    fontSize: 10,
    color: "#111111",
    paddingBottom: 40,
  },
  body: { paddingHorizontal: 40, paddingTop: 24, gap: 18 },
});

function PrintedMenu({ data }: { data: PrintedMenuData }) {
  const number = new Map(data.allergens.map((a, i) => [a.code, i + 1]));
  return (
    <Document
      title={`${data.businessName} · Menü`}
      author={data.businessName}
      language={data.lang}
    >
      <Page size="A4" style={s.page}>
        <View
          style={{
            backgroundColor: data.accent,
            paddingVertical: 22,
            paddingHorizontal: 40,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
          }}
        >
          {data.logo && (
            <Image
              src={{ data: data.logo, format: "png" }}
              style={{ width: 44, height: 44, objectFit: "contain" }}
            />
          )}
          <View>
            <Text
              style={{ color: data.onAccent, fontSize: 24, fontWeight: 700 }}
            >
              {data.businessName}
            </Text>
            <Text style={{ color: data.onAccent, fontSize: 11 }}>
              {data.branchName}
            </Text>
          </View>
        </View>

        <View style={s.body}>
          {data.categories.map((category) => (
            <View key={category.id} style={{ gap: 8 }}>
              <View
                wrap={false}
                style={{
                  borderBottomWidth: 1.5,
                  borderBottomColor: data.accentText,
                  paddingBottom: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: data.accentText,
                  }}
                >
                  {category.name}
                </Text>
                {category.description && (
                  <Text style={{ fontSize: 9, color: MUTED }}>
                    {category.description}
                  </Text>
                )}
              </View>
              {category.products.map((product) => {
                const codes = product.allergens
                  .map((a) => number.get(a.code))
                  .filter(Boolean)
                  .sort((a, b) => a! - b!);
                const single =
                  product.variants.length === 1 && !product.variants[0].name;
                return (
                  <View key={product.id} wrap={false} style={{ gap: 1.5 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontWeight: 600 }}>{product.name}</Text>
                      <View
                        style={{
                          flex: 1,
                          borderBottomWidth: 0.75,
                          borderBottomColor: "#999999",
                          borderBottomStyle: "dotted",
                          marginBottom: 3,
                        }}
                      />
                      {single && (
                        <Text style={{ fontWeight: 600 }}>
                          {formatPriceText(product.variants[0].price)}
                        </Text>
                      )}
                    </View>
                    {!single && (
                      <Text style={{ fontSize: 9 }}>
                        {product.variants
                          .map(
                            (v) =>
                              `${v.name ?? ""} ${formatPriceText(v.price)}`,
                          )
                          .join("   ·   ")}
                      </Text>
                    )}
                    {product.description && (
                      <Text style={{ fontSize: 8.5, color: MUTED }}>
                        {product.description}
                      </Text>
                    )}
                    {codes.length > 0 && (
                      <Text style={{ fontSize: 7.5, color: MUTED }}>
                        {data.text.allergens}: {codes.join(", ")}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View
            wrap={false}
            style={{
              marginTop: 8,
              flexDirection: "row",
              gap: 16,
              borderTopWidth: 0.5,
              borderTopColor: "#CCCCCC",
              paddingTop: 12,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: 700 }}>
                {data.text.allergens}
              </Text>
              <Text style={{ fontSize: 8, color: MUTED, lineHeight: 1.5 }}>
                {data.allergens.map((a, i) => `${i + 1} ${a.name}`).join(" · ")}
              </Text>
              <Text style={{ fontSize: 8, color: MUTED }}>
                {data.text.note}
              </Text>
            </View>
            <View style={{ alignItems: "center", gap: 2 }}>
              <Image
                src={{ data: data.qr, format: "png" }}
                style={{ width: 64, height: 64 }}
              />
              <Text style={{ fontSize: 7, color: MUTED }}>
                {data.text.scan}
              </Text>
            </View>
          </View>
        </View>

        <Text
          fixed
          style={{
            position: "absolute",
            bottom: 18,
            left: 40,
            right: 40,
            fontSize: 7.5,
            color: MUTED,
            textAlign: "center",
          }}
          render={({ pageNumber, totalPages }) =>
            `${data.businessName} · ${data.displayUrl} · ${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export function renderPrintedMenuPdf(data: PrintedMenuData) {
  return renderToBuffer(<PrintedMenu data={data} />);
}
