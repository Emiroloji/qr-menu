"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    null,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col gap-4 text-sm">
        <p>
          Bu e-posta adresi kayıtlıysa şifre sıfırlama bağlantısı gönderildi.
          Gelen kutunuzu kontrol edin.
        </p>
        <Link
          href="/login"
          className="font-medium underline-offset-4 hover:underline"
        >
          Girişe dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Gönderiliyor…" : "Bağlantı gönder"}
      </Button>
      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Girişe dön
      </Link>
    </form>
  );
}
