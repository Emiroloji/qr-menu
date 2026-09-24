"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { isBot } from "@/lib/scan-log";

const productViewSchema = z.object({
  branchId: z.string().min(1).max(40),
  productId: z.string().min(1).max(40),
});

/**
 * Müşteri menüde bir ürünün detayını açtığında çağrılır ("en çok açılan ürünler").
 * Oturum gerektirmez; IP adresi yalnızca hız sınırı için bellekte kullanılır,
 * saklanmaz (KURALLAR 7). Kayıt yanıttan sonra yazılır, sonuç döndürülmez.
 */
export async function recordProductView(input: unknown) {
  const parsed = productViewSchema.safeParse(input);
  if (!parsed.success) return;
  const requestHeaders = await headers();
  if (isBot(requestHeaders.get("user-agent") ?? "")) return;
  if (
    !consumeRateLimit(
      `view:${clientIp(requestHeaders)}`,
      RATE_LIMITS.productView,
    )
  )
    return;

  const { branchId, productId } = parsed.data;
  after(async () => {
    // Ürün bu şubenin yayındaki menüsünde olmalı; başka şubeye kayıt yazılamaz.
    const product = await db.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
        isVisible: true,
        category: {
          branchId,
          deletedAt: null,
          branch: { deletedAt: null },
        },
      },
      select: { id: true },
    });
    if (product) await db.productView.create({ data: { branchId, productId } });
  });
}
