import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

/**
 * Henüz şifresi olmayan (süper adminin yeni açtığı) hesaba "hesabınız oluşturuldu",
 * diğerlerine "şifre sıfırlama" e-postası gider. İkisi de aynı bağlantıyı kullanır.
 */
async function sendPasswordMail(
  user: { id: string; name: string; email: string },
  url: string,
) {
  const hasPassword = await db.account.count({
    where: { userId: user.id, providerId: "credential" },
  });
  const [subject, intro] = hasPassword
    ? [
        "Şifre sıfırlama",
        "Şifrenizi sıfırlamak için aşağıdaki bağlantıyı açın.",
      ]
    : [
        "QR Menü hesabınız oluşturuldu",
        "İşletmeniz için QR Menü hesabı açıldı. Panele girebilmek için aşağıdaki bağlantıdan şifrenizi belirleyin.",
      ];
  await sendMail({
    to: user.email,
    subject,
    text: `Merhaba ${user.name},\n\n${intro} Bağlantı 24 saat geçerlidir.\n\n${url}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
  });
}

// BETTER_AUTH_SECRET ve BETTER_AUTH_URL ortam değişkenlerinden okunur.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Hesapları süper admin açar; kendi kendine kayıt Faz 3.1'de.
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    // Yeni hesap e-postası da bu bağlantıyı kullanır; sahibin fark etmesi zaman alabilir.
    resetPasswordTokenExpiresIn: 60 * 60 * 24,
    sendResetPassword: async ({ user, url }) => {
      // Beklenmez: yanıt süresi e-postanın kayıtlı olup olmadığını ele vermesin.
      void sendPasswordMail(user, url).catch((error) =>
        console.error("Şifre e-postası gönderilemedi", error),
      );
    },
  },
  // HTTP uçları için (canlıda açık). Paneldeki giriş formu Server Action ile çalıştığından
  // ayrıca lib/rate-limit.ts ile sınırlanır.
  rateLimit: {
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 900, max: 10 },
      "/request-password-reset": { window: 900, max: 5 },
      "/reset-password": { window: 900, max: 10 },
    },
  },
  plugins: [nextCookies()],
});
