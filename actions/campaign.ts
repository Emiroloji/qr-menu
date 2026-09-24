"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import {
  MAX_FEATURED_PRODUCTS,
  MAX_SPECIAL_DAYS_AHEAD,
  specialDateFromKey,
} from "@/lib/campaigns";
import { db } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/format";
import { isLanguageCode } from "@/lib/languages";
import {
  assertBranchBelongsToBusiness,
  assertCampaignBelongsToBusiness,
  assertProductBelongsToBusiness,
} from "@/lib/ownership";
import { requirePermission } from "@/lib/permissions";
import { productImageFiles } from "@/lib/product-image";
import { requireWritableSession } from "@/lib/session";
import { deleteFiles } from "@/lib/storage";
import { setTranslation, type Translations } from "@/lib/translations";
import {
  campaignSchema,
  dailySpecialSchema,
  featuredSchema,
} from "@/lib/validations/campaign";
import { firstError, id } from "@/lib/validations/common";

// Kampanyalar (Faz 2.3). Yetki: CAMPAIGN_EDIT (MIMARI §6); işletme sahibinde her zaman var.

const MAX_TRANSLATION_LENGTH = 200;

async function requireCampaignEditor() {
  const session = await requireWritableSession();
  await requirePermission(session.user, "CAMPAIGN_EDIT");
  return session;
}

/**
 * Kampanya ekler veya düzenler. Çeviriler `name:{dil}` ve `description:{dil}` alanlarıyla
 * gelir; yalnızca şubede açık diller kaydedilir.
 */
export async function saveCampaign(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  try {
    const { businessId } = await requireCampaignEditor();
    const campaignId = id.optional().parse(formData.get("id") || undefined);
    const parsed = campaignSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    let branchId: string;
    let translations: Translations = {};
    if (campaignId) {
      ({ branchId } = await assertCampaignBelongsToBusiness(
        campaignId,
        businessId,
      ));
      const current = await db.campaign.findUniqueOrThrow({
        where: { id: campaignId },
        select: { translations: true },
      });
      translations = current.translations as Translations;
    } else {
      branchId = id.parse(formData.get("branchId"));
      await assertBranchBelongsToBusiness(branchId, businessId);
    }

    const branch = await db.branch.findUniqueOrThrow({
      where: { id: branchId },
      select: { languages: true },
    });
    for (const lang of branch.languages) {
      if (lang === "tr" || !isLanguageCode(lang)) continue;
      const name = formData.get(`name:${lang}`);
      const description = formData.get(`description:${lang}`);
      if (typeof name !== "string" || typeof description !== "string") continue;
      if (
        name.length > MAX_TRANSLATION_LENGTH ||
        description.length > MAX_TRANSLATION_LENGTH
      ) {
        return {
          ok: false,
          error: "Çeviriler en fazla 200 karakter olabilir.",
        };
      }
      translations = setTranslation(translations, lang, { name, description });
    }

    const { startsAt, endsAt, ...rest } = parsed.data;
    const data = {
      ...rest,
      startsAt: parseDateInput(startsAt, "start"),
      endsAt: parseDateInput(endsAt, "end"),
      translations,
    };
    const campaign = campaignId
      ? await db.campaign.update({ where: { id: campaignId }, data })
      : await db.campaign.create({ data: { ...data, branchId } });

    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: { id: campaign.id } };
  } catch (error) {
    return toActionError(error);
  }
}

/** Kampanya kalıcı olarak silinir, görseli de depodan silinir (MIMARI §9). */
export async function deleteCampaign(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { businessId } = await requireCampaignEditor();
    const parsed = z.object({ campaignId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const campaign = await assertCampaignBelongsToBusiness(
      parsed.data.campaignId,
      businessId,
    );

    await db.campaign.delete({ where: { id: campaign.id } });
    if (campaign.imageUrl)
      await deleteFiles(productImageFiles(campaign.imageUrl));
    expireBranchMenu(campaign.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function removeCampaignImage(
  campaignId: string,
): Promise<ActionResult<null>> {
  try {
    const { businessId } = await requireCampaignEditor();
    const campaign = await assertCampaignBelongsToBusiness(
      id.parse(campaignId),
      businessId,
    );
    if (!campaign.imageUrl) return { ok: true, data: null };

    await db.campaign.update({
      where: { id: campaign.id },
      data: { imageUrl: null, blurDataUrl: null },
    });
    await deleteFiles(productImageFiles(campaign.imageUrl));
    expireBranchMenu(campaign.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Bir güne günün önerisini atar; o günün önceki önerisi değişir. */
export async function saveDailySpecial(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const { businessId } = await requireCampaignEditor();
    const parsed = dailySpecialSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { branchId, productId, date } = parsed.data;

    const today = toDateInputValue(new Date());
    const last = toDateInputValue(
      new Date(Date.now() + MAX_SPECIAL_DAYS_AHEAD * 24 * 60 * 60 * 1000),
    );
    if (date < today)
      return { ok: false, error: "Geçmiş bir güne öneri eklenemez." };
    if (date > last)
      return {
        ok: false,
        error: `Öneri en fazla ${MAX_SPECIAL_DAYS_AHEAD} gün ileriye planlanabilir.`,
      };

    await assertBranchBelongsToBusiness(branchId, businessId);
    const product = await assertProductBelongsToBusiness(productId, businessId);
    if (product.branchId !== branchId)
      return { ok: false, error: "Ürün bu şubenin menüsünde değil." };

    const day = specialDateFromKey(date);
    await db.dailySpecial.upsert({
      where: { branchId_date: { branchId, date: day } },
      create: { branchId, productId, date: day },
      update: { productId },
    });
    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteDailySpecial(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { businessId } = await requireCampaignEditor();
    const parsed = z.object({ specialId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const special = await db.dailySpecial.findFirst({
      where: {
        id: parsed.data.specialId,
        branch: { businessId, deletedAt: null },
      },
      select: { id: true, branchId: true },
    });
    if (!special) return { ok: false, error: "Öneri bulunamadı." };

    await db.dailySpecial.delete({ where: { id: special.id } });
    expireBranchMenu(special.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Ürünü menünün "Öne çıkanlar" alanına ekler veya çıkarır. */
export async function setProductFeatured(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { businessId } = await requireCampaignEditor();
    const parsed = featuredSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const product = await assertProductBelongsToBusiness(
      parsed.data.productId,
      businessId,
    );

    if (parsed.data.isFeatured) {
      const count = await db.product.count({
        where: {
          isFeatured: true,
          deletedAt: null,
          id: { not: product.id },
          category: { branchId: product.branchId, deletedAt: null },
        },
      });
      if (count >= MAX_FEATURED_PRODUCTS)
        return {
          ok: false,
          error: `En fazla ${MAX_FEATURED_PRODUCTS} ürün öne çıkarılabilir.`,
        };
    }

    await db.product.update({
      where: { id: product.id },
      data: { isFeatured: parsed.data.isFeatured },
    });
    expireBranchMenu(product.branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
