import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Docker ve izleme için sağlık kontrolü: uygulama ve veritabanı çalışıyor mu? */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
