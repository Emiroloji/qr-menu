import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";

export default async function AdminPage() {
  // Yetki her sayfada ayrıca denetlenir: layout istemci gezintisinde atlanabilir.
  await requireRole("SUPER_ADMIN");
  redirect("/admin/businesses");
}
