import { requireRole } from "@/lib/session";

// Rol kontrolü: yalnızca SUPER_ADMIN. Admin düzeni Faz 1.3'te.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireRole("SUPER_ADMIN");
  return children;
}
