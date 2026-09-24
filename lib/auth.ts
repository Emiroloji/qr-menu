import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";

// BETTER_AUTH_SECRET ve BETTER_AUTH_URL ortam değişkenlerinden okunur.
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Hesapları süper admin açar; kendi kendine kayıt Faz 3.1'de.
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Beklenmez: yanıt süresi e-postanın kayıtlı olup olmadığını ele vermesin.
      void sendMail({
        to: user.email,
        subject: "Şifre sıfırlama",
        text: `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıyı açın. Bağlantı 1 saat geçerlidir.\n\n${url}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
      }).catch((error) =>
        console.error("Şifre sıfırlama e-postası gönderilemedi", error),
      );
    },
  },
  plugins: [nextCookies()],
});
