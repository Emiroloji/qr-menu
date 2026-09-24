import "server-only";
import {
  daysUntil,
  EXPIRY_WARNING_DAYS,
  getCurrentSubscription,
} from "@/lib/business-status";
import { COMPANY } from "@/lib/company";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { sendMail } from "@/lib/mail";

// Abonelik bitişine 7 gün kala işletme sahibine e-posta (MIMARI §7, FAZLAR 2.5).
// Saatlik çağrılır (/api/cron/subscription-reminders); her abonelik için bir kez gönderilir.

const DAY_MS = 24 * 60 * 60 * 1000;

type SubscriptionRow = {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED";
  startsAt: Date;
  endsAt: Date;
  reminderSentAt: Date | null;
};

/**
 * Hatırlatma gönderilecek abonelik: şu an geçerli, askıda değil, bitişe 7 gün veya daha az
 * kalmış, hatırlatması gönderilmemiş ve arkasından başlayacak yeni bir abonelik yok.
 */
export function subscriptionToRemind<T extends SubscriptionRow>(
  subscriptions: T[],
  now: Date,
): T | null {
  const current = getCurrentSubscription(subscriptions, now);
  if (!current || current.status !== "ACTIVE" || current.reminderSentAt)
    return null;
  if (current.endsAt.getTime() - now.getTime() > EXPIRY_WARNING_DAYS * DAY_MS)
    return null;
  const renewed = subscriptions.some(
    (s) =>
      s.id !== current.id &&
      s.status !== "EXPIRED" &&
      s.endsAt > current.endsAt,
  );
  return renewed ? null : current;
}

export function reminderMail(input: {
  ownerName: string;
  businessName: string;
  planName: string;
  endsAt: Date;
  now: Date;
}) {
  const days = daysUntil(input.endsAt, input.now);
  const panelUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/panel`;
  return {
    subject: `Aboneliğinizin bitmesine ${days} gün kaldı`,
    text: [
      `Merhaba ${input.ownerName},`,
      "",
      `${input.businessName} işletmesinin ${input.planName} paket aboneliği ${formatDate(input.endsAt)} tarihinde sona eriyor.`,
      "Süre dolduğunda menünüz yayından kalkar ve paneliniz salt okunur olur.",
      "",
      `Aboneliğinizi uzatmak için bizimle iletişime geçin: ${COMPANY.supportEmail}`,
      "",
      `Panel: ${panelUrl}`,
    ].join("\n"),
  };
}

/** Gönderilmesi gereken hatırlatmaları gönderir; gönderilen sayısını döndürür. */
export async function sendSubscriptionReminders(now = new Date()) {
  const businesses = await db.business.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      subscriptions: {
        some: {
          status: "ACTIVE",
          reminderSentAt: null,
          startsAt: { lte: now },
          endsAt: {
            gt: now,
            lte: new Date(now.getTime() + EXPIRY_WARNING_DAYS * DAY_MS),
          },
        },
      },
    },
    include: {
      subscriptions: { include: { plan: { select: { name: true } } } },
      users: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
      },
    },
  });

  let sent = 0;
  for (const business of businesses) {
    const subscription = subscriptionToRemind(business.subscriptions, now);
    if (!subscription) continue;
    // Önce işaretlenir: e-posta sunucusu hata verse de aynı saatte tekrar denenmez;
    // gönderilemezse işaret geri alınır ve bir sonraki çalışmada yeniden denenir.
    await db.subscription.update({
      where: { id: subscription.id },
      data: { reminderSentAt: now },
    });
    try {
      for (const owner of business.users) {
        await sendMail({
          to: owner.email,
          ...reminderMail({
            ownerName: owner.name,
            businessName: business.name,
            planName: subscription.plan.name,
            endsAt: subscription.endsAt,
            now,
          }),
        });
      }
      sent++;
    } catch (error) {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { reminderSentAt: null },
      });
      throw error;
    }
  }
  return sent;
}
