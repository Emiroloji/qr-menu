"use server";

import { refresh } from "next/cache";
import { ActionError, type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { isLanguageCode } from "@/lib/languages";
import { assertBranchBelongsToBusiness } from "@/lib/ownership";
import { hasPermission } from "@/lib/permissions";
import { requireWritableSession } from "@/lib/session";
import { readTranslations, setTranslation } from "@/lib/translations";
import { id } from "@/lib/validations/common";

type Values = { name?: string; description?: string };
const FIELD = /^(c|p|v):([^:]+):(name|description)$/;
const MAX_LENGTH = 500;

/**
 * Bir şubenin bir dildeki çevirilerini kaydeder. Form alanları:
 * `c:{kategori}:name|description`, `p:{ürün}:name|description`, `v:{boy}:name`.
 */
export async function saveTranslations(
  _prev: FormState<{ count: number }>,
  formData: FormData,
): Promise<FormState<{ count: number }>> {
  try {
    const { user, businessId } = await requireWritableSession();
    const canCategory = hasPermission(user, "CATEGORY_EDIT");
    const canProduct = hasPermission(user, "PRODUCT_EDIT");
    if (!canCategory && !canProduct)
      throw new ActionError("Bu işlem için yetkiniz yok.");

    const branchId = id.parse(formData.get("branchId"));
    await assertBranchBelongsToBusiness(branchId, businessId);
    const branch = await db.branch.findUniqueOrThrow({
      where: { id: branchId },
    });
    const lang = formData.get("lang");
    if (
      typeof lang !== "string" ||
      !isLanguageCode(lang) ||
      lang === "tr" ||
      !branch.languages.includes(lang)
    ) {
      return { ok: false, error: "Bu dil şubede açık değil." };
    }

    // Alanları kayıt türüne göre grupla.
    const groups = {
      c: new Map<string, Values>(),
      p: new Map<string, Values>(),
      v: new Map<string, Values>(),
    };
    for (const [key, value] of formData.entries()) {
      const match = FIELD.exec(key);
      if (!match || typeof value !== "string") continue;
      if (value.length > MAX_LENGTH)
        return {
          ok: false,
          error: "Çeviriler en fazla 500 karakter olabilir.",
        };
      const [, type, recordId, field] = match as unknown as [
        string,
        "c" | "p" | "v",
        string,
        keyof Values,
      ];
      if (type === "v" && field !== "name") continue;
      groups[type].set(recordId, {
        ...groups[type].get(recordId),
        [field]: value,
      });
    }
    if (groups.c.size && !canCategory)
      throw new ActionError("Kategori çevirileri için yetkiniz yok.");
    if ((groups.p.size || groups.v.size) && !canProduct) {
      throw new ActionError("Ürün çevirileri için yetkiniz yok.");
    }

    // İşletme izolasyonu: tüm kayıtlar bu şubeye ait olmalı.
    const inBranch = { branchId, deletedAt: null };
    const [categories, products, variants] = await Promise.all([
      db.category.findMany({
        where: { id: { in: [...groups.c.keys()] }, ...inBranch },
        select: { id: true, translations: true },
      }),
      db.product.findMany({
        where: {
          id: { in: [...groups.p.keys()] },
          deletedAt: null,
          category: inBranch,
        },
        select: { id: true, translations: true },
      }),
      db.productVariant.findMany({
        where: {
          id: { in: [...groups.v.keys()] },
          product: { deletedAt: null, category: inBranch },
        },
        select: { id: true, translations: true },
      }),
    ]);
    if (
      categories.length !== groups.c.size ||
      products.length !== groups.p.size ||
      variants.length !== groups.v.size
    ) {
      return {
        ok: false,
        error: "Bazı kayıtlar bulunamadı. Sayfayı yenileyip tekrar deneyin.",
      };
    }

    // Yalnızca değişenleri güncelle.
    const changed = <T extends { id: string; translations: unknown }>(
      records: T[],
      values: Map<string, Values>,
    ) =>
      records
        .map((r) => ({
          id: r.id,
          next: setTranslation(r.translations, lang, values.get(r.id)!),
        }))
        .filter(
          (r, i) =>
            JSON.stringify(r.next) !==
            JSON.stringify(readTranslations(records[i].translations)),
        )
        .map((r) => ({
          id: r.id,
          translations: r.next as Prisma.InputJsonValue,
        }));

    const updates = [
      ...changed(categories, groups.c).map((d) =>
        db.category.update({ where: { id: d.id }, data: d }),
      ),
      ...changed(products, groups.p).map((d) =>
        db.product.update({ where: { id: d.id }, data: d }),
      ),
      ...changed(variants, groups.v).map((d) =>
        db.productVariant.update({ where: { id: d.id }, data: d }),
      ),
    ];
    if (updates.length) {
      await db.$transaction(updates);
      expireBranchMenu(branchId);
      refresh();
    }
    return { ok: true, data: { count: updates.length } };
  } catch (error) {
    return toActionError(error);
  }
}
