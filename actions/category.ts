"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { type ActionResult, type FormState, toActionError } from "@/lib/action";
import { expireBranchMenu } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  assertBranchBelongsToBusiness,
  assertCategoryBelongsToBusiness,
} from "@/lib/ownership";
import { requirePermission } from "@/lib/permissions";
import { requireWritableSession } from "@/lib/session";
import { firstError, id } from "@/lib/validations/common";
import { categorySchema, reorderSchema } from "@/lib/validations/menu";

export async function saveCategory(
  _prev: FormState<{ id: string }>,
  formData: FormData,
): Promise<FormState<{ id: string }>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "CATEGORY_EDIT");

    const categoryId = id.optional().parse(formData.get("id") || undefined);
    const parsed = categorySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

    let branchId: string;
    let category;
    if (categoryId) {
      ({ branchId } = await assertCategoryBelongsToBusiness(
        categoryId,
        businessId,
      ));
      category = await db.category.update({
        where: { id: categoryId },
        data: parsed.data,
      });
    } else {
      branchId = id.parse(formData.get("branchId"));
      await assertBranchBelongsToBusiness(branchId, businessId);
      const last = await db.category.aggregate({
        where: { branchId, deletedAt: null },
        _max: { sortOrder: true },
      });
      category = await db.category.create({
        data: {
          ...parsed.data,
          branchId,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
      });
    }

    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: { id: category.id } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function setCategoryVisibility(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "CATEGORY_EDIT");
    const parsed = z
      .object({ categoryId: id, isVisible: z.boolean() })
      .safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { branchId } = await assertCategoryBelongsToBusiness(
      parsed.data.categoryId,
      businessId,
    );

    await db.category.update({
      where: { id: parsed.data.categoryId },
      data: { isVisible: parsed.data.isVisible },
    });
    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Yumuşak silme; içindeki ürünler de menüden kalkar, kategori geri getirilirse döner. */
export async function deleteCategory(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "CATEGORY_EDIT");
    const parsed = z.object({ categoryId: id }).safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { branchId } = await assertCategoryBelongsToBusiness(
      parsed.data.categoryId,
      businessId,
    );

    await db.category.update({
      where: { id: parsed.data.categoryId },
      data: { deletedAt: new Date() },
    });
    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** `parentId`: şube. `ids`: kategorilerin yeni sırası. */
export async function reorderCategories(
  input: unknown,
): Promise<ActionResult<null>> {
  try {
    const { user, businessId } = await requireWritableSession();
    await requirePermission(user, "CATEGORY_EDIT");
    const parsed = reorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
    const { parentId: branchId, ids } = parsed.data;
    await assertBranchBelongsToBusiness(branchId, businessId);

    const owned = await db.category.count({
      where: { id: { in: ids }, branchId, deletedAt: null },
    });
    if (owned !== ids.length)
      return { ok: false, error: "Kategori bulunamadı." };

    await db.$transaction(
      ids.map((categoryId, sortOrder) =>
        db.category.update({ where: { id: categoryId }, data: { sortOrder } }),
      ),
    );
    expireBranchMenu(branchId);
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
