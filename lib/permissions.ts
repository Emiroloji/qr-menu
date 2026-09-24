import type { Permission, Role } from "@/lib/generated/prisma/enums";
import { ActionError } from "@/lib/action";

type UserWithPermissions = {
  role: Role;
  permissions: { permission: Permission }[];
};

/** Çalışan yetkileri ve açıklamaları (MIMARI §6). */
export const PERMISSION_LABELS: Record<
  Permission,
  { label: string; description: string }
> = {
  PRODUCT_TOGGLE_AVAILABILITY: {
    label: "Tükendi işaretleme",
    description: "Biten ürünü “Tükendi”, geleni “Mevcut” yapar.",
  },
  PRODUCT_EDIT_PRICE: {
    label: "Fiyat güncelleme",
    description: "Ürün fiyatlarını ve toplu zam/indirimi değiştirir.",
  },
  PRODUCT_EDIT: {
    label: "Ürün ekleme ve düzenleme",
    description: "Ürün ekler, düzenler, gizler, siler; görsel ve çeviri girer.",
  },
  CATEGORY_EDIT: {
    label: "Kategori yönetimi",
    description: "Kategori ekler, düzenler, sıralar, gizler, siler.",
  },
  CAMPAIGN_EDIT: {
    label: "Kampanya yönetimi",
    description:
      "Kampanya banner'ı, günün önerisi ve öne çıkan ürünleri yönetir.",
  },
};

/** Menü ekranına erişim sağlayan yetkiler. */
export const MENU_PERMISSIONS: Permission[] = [
  "PRODUCT_TOGGLE_AVAILABILITY",
  "PRODUCT_EDIT_PRICE",
  "PRODUCT_EDIT",
  "CATEGORY_EDIT",
];

/** Çalışana verilebilen tüm yetkiler (çalışan formu sırası). */
export const STAFF_PERMISSIONS: Permission[] = [
  ...MENU_PERMISSIONS,
  "CAMPAIGN_EDIT",
];

export function homePathFor(role: Role) {
  return role === "SUPER_ADMIN" ? "/admin" : "/panel";
}

/** İşletme sahibi her şeyi yapar; çalışan yalnızca kendisine verilen yetkileri. */
export function hasPermission(
  user: UserWithPermissions,
  permission: Permission,
) {
  if (user.role === "OWNER") return true;
  if (user.role === "STAFF") {
    return user.permissions.some((p) => p.permission === permission);
  }
  return false;
}

export function hasAnyMenuPermission(user: UserWithPermissions) {
  return MENU_PERMISSIONS.some((p) => hasPermission(user, p));
}

export async function requirePermission(
  user: UserWithPermissions,
  permission: Permission,
) {
  if (!hasPermission(user, permission)) {
    throw new ActionError("Bu işlem için yetkiniz yok.");
  }
}

/** Şube, çalışan, görünüm ve işletme ayarları yalnızca işletme sahibine açıktır (MIMARI §6). */
export async function assertOwner(user: { role: Role }) {
  if (user.role !== "OWNER") {
    throw new ActionError("Bu işlem için yetkiniz yok.");
  }
}
