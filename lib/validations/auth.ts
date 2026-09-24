import { z } from "zod";

const email = z.email("Geçerli bir e-posta adresi girin.");
const password = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı.")
  .max(128, "Şifre en fazla 128 karakter olabilir.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Şifrenizi girin."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirm"],
  });
