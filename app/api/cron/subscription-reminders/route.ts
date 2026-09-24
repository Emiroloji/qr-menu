import { timingSafeEqual } from "node:crypto";
import { sendSubscriptionReminders } from "@/lib/subscription-reminders";

// Zamanlanmış görev ucu (FAZLAR 2.5): canlıda docker-compose.prod.yml içindeki `cron`
// servisi saatte bir çağırır. `Authorization: Bearer $CRON_SECRET` ister.

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET)
    return Response.json(
      { error: "CRON_SECRET tanımlı değil." },
      { status: 503 },
    );
  if (!authorized(request))
    return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const sent = await sendSubscriptionReminders();
  return Response.json({ sent });
}
