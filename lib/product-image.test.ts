import { describe, expect, it } from "vitest";
import {
  productImageFiles,
  productImageOriginal,
  productImageSrc,
  proxiedImageUrl,
} from "./product-image";

const r2 = "https://pub-abc123.r2.dev/business/b1/products/p1/uuid";

describe("proxiedImageUrl", () => {
  it("r2.dev adresini kendi sunucumuzdaki /img yoluna çevirir", () => {
    expect(proxiedImageUrl(`${r2}-400.webp`)).toBe(
      "/img/business/b1/products/p1/uuid-400.webp",
    );
  });

  it("başka adreslere dokunmaz", () => {
    for (const url of [
      "http://localhost:9090/qrmenu/business/b1/x-400.webp",
      "https://img.karefix.com.tr/business/b1/x-400.webp",
      "https://r2.dev.example.com/x.webp",
      "/img/business/b1/x-400.webp",
    ])
      expect(proxiedImageUrl(url)).toBe(url);
  });
});

describe("productImageSrc", () => {
  it("genişliği karşılayan en küçük boyutu seçer ve adresi çevirir", () => {
    expect(productImageSrc(r2, 300)).toBe(
      "/img/business/b1/products/p1/uuid-400.webp",
    );
    expect(productImageSrc(r2, 800)).toBe(
      "/img/business/b1/products/p1/uuid-800.webp",
    );
    expect(productImageSrc(r2, 5000)).toBe(
      "/img/business/b1/products/p1/uuid-1200.webp",
    );
  });
});

describe("depo adresleri", () => {
  it("silme ve kopyalamada kullanılan adresler çevrilmez", () => {
    expect(productImageFiles(r2)).toEqual([
      `${r2}-400.webp`,
      `${r2}-800.webp`,
      `${r2}-1200.webp`,
    ]);
    expect(productImageOriginal(r2, 800)).toBe(`${r2}-800.webp`);
  });
});
