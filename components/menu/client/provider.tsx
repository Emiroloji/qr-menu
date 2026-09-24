"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MenuClientData } from "../client-data";
import { MenuContext, type Panel } from "./context";
import { InfoPanel } from "./info-panel";
import { LanguagePanel } from "./language-panel";
import { ProductDetail } from "./product-detail";
import { Sheet } from "./sheet";

const SearchDialog = dynamic(() => import("./search-dialog"), { ssr: false });

/** Menünün etkileşimli parçaları: ürün detayı, bilgiler, dil ve arama. */
export function MenuProvider({
  data,
  children,
}: {
  data: MenuClientData;
  children: React.ReactNode;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  // Kapanma animasyonu sürerken içerik kaybolmasın diye son açılan ürün saklanır.
  const [productId, setProductId] = useState<string | null>(null);
  const [searchLoaded, setSearchLoaded] = useState(false);
  const products = useMemo(
    () => new Map(data.products.map((p) => [p.id, p])),
    [data.products],
  );
  const product = productId ? products.get(productId) : undefined;

  const context = useMemo(
    () => ({
      data,
      open: (next: Panel) => {
        if (next.type === "product") setProductId(next.id);
        if (next.type === "search") setSearchLoaded(true);
        setPanel(next);
      },
    }),
    [data],
  );
  const close = () => setPanel(null);

  return (
    <MenuContext value={context}>
      {children}
      <Sheet
        open={panel?.type === "product"}
        onClose={close}
        label={product?.name ?? ""}
        closeLabel={data.text.close}
      >
        {product && <ProductDetail product={product} data={data} />}
      </Sheet>
      <Sheet
        open={panel?.type === "info"}
        onClose={close}
        label={data.text.info}
        closeLabel={data.text.close}
      >
        <InfoPanel data={data} />
      </Sheet>
      <Sheet
        open={panel?.type === "language"}
        onClose={close}
        label={data.text.language}
        closeLabel={data.text.close}
      >
        <LanguagePanel data={data} />
      </Sheet>
      {searchLoaded && (
        <SearchDialog
          data={data}
          open={panel?.type === "search"}
          onClose={close}
          onSelect={(id) => context.open({ type: "product", id })}
        />
      )}
    </MenuContext>
  );
}
