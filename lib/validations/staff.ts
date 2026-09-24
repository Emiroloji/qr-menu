import { z } from "zod";
import { STAFF_PERMISSIONS } from "@/lib/permissions";

export const staffSchema = z.object({
  name: z.string().trim().min(1, "Çalışanın adını girin.").max(100),
  permissions: z
    .array(z.enum(STAFF_PERMISSIONS as [string, ...string[]]))
    .transform((p) => [...new Set(p)]),
});

export const newStaffSchema = staffSchema.extend({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Geçerli bir e-posta adresi girin.")),
});
