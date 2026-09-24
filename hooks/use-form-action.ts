"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/action";

/**
 * Server Action'ı form gönderiminde çalıştırır. `onSubmit` kullanılır:
 * React'in form `action`'ı hata sonrası alanları temizler.
 */
export function useFormAction<T>(
  action: (prev: FormState<T>, formData: FormData) => Promise<FormState<T>>,
  onSuccess?: (data: T) => void,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(null, formData);
      if (result?.ok) onSuccess?.(result.data);
      else if (result) setError(result.error);
    });
  }

  return { pending, error, onSubmit };
}
