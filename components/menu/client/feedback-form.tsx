"use client";

import { useMemo, useState } from "react";
import { StarIcon } from "lucide-react";
import { createTranslator } from "next-intl";
import { submitFeedback } from "@/actions/feedback";
import { FEEDBACK_MESSAGE_MAX } from "@/lib/feedback-rules";
import type { MenuClientData } from "../client-data";

type Status = "idle" | "sending" | "sent" | "limited" | "error";

/**
 * "Bizi değerlendirin" formu: 1–5 yıldız (zorunlu) ve isteğe bağlı mesaj.
 * Butona basınca yüklenir (provider'da next/dynamic); menünün ilk yüküne girmez.
 */
export default function FeedbackForm({
  data,
  branchId,
}: {
  data: MenuClientData;
  branchId: string;
}) {
  const { text } = data;
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  // Çoğul biçimleri ("{count, plural, …}") next-intl çözer.
  const t = useMemo(
    () =>
      createTranslator({
        locale: data.lang,
        messages: { menu: text },
        namespace: "menu",
      }),
    [data.lang, text],
  );

  if (status === "sent")
    return (
      <p role="status" className="px-5 pt-10 pb-12 text-center font-semibold">
        {text.feedbackThanks}
      </p>
    );

  return (
    <form
      className="flex flex-col gap-5 px-5 pt-6 pb-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (rating === 0 || status === "sending") return;
        setStatus("sending");
        try {
          const result = await submitFeedback({
            branchId,
            rating,
            message,
            lang: data.lang,
          });
          setStatus(
            result.ok
              ? "sent"
              : result.error === "limited"
                ? "limited"
                : "error",
          );
        } catch {
          setStatus("error");
        }
      }}
    >
      <h2 className="pe-10 font-menu-display text-2xl font-bold">
        {text.rateUs}
      </h2>
      <fieldset>
        <legend className="mb-2 font-semibold">{text.ratingLabel}</legend>
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="peer sr-only"
              />
              <span className="sr-only">{t("stars", { count: n })}</span>
              <StarIcon
                aria-hidden
                className={`size-11 rounded-md p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-menu-accent-text ${
                  n <= rating
                    ? "fill-menu-accent-text text-menu-accent-text"
                    : "text-menu-muted"
                }`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="font-semibold">{text.feedbackMessage}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={FEEDBACK_MESSAGE_MAX}
          rows={4}
          className="rounded-lg border border-menu-line bg-menu-bg p-3 text-base"
        />
        <span className="text-sm text-menu-muted">{text.feedbackNote}</span>
      </label>
      {(status === "limited" || status === "error") && (
        <p role="alert" className="text-sm font-semibold">
          {status === "limited" ? text.feedbackLimited : text.feedbackError}
        </p>
      )}
      <button
        type="submit"
        disabled={rating === 0 || status === "sending"}
        className="flex h-12 items-center justify-center rounded-full bg-menu-accent font-semibold text-menu-on-accent disabled:opacity-50"
      >
        {text.send}
      </button>
    </form>
  );
}
