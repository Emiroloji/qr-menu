import type { Permission, Role } from "@/lib/generated/prisma/enums";
import { ActionError } from "@/lib/action";

type UserWithPermissions = {
  role: Role;
  permissions: { permission: Permission }[];
};

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
