import type { Instrumentation } from "next";

// Hata izleme: sunucu hataları her zaman tek satırlık JSON olarak kaydedilir; SENTRY_DSN
// tanımlıysa ayrıca GlitchTip'e (kendi sunucumuzda, ücretsiz; Sentry uyumlu) gönderilir.
// Tarayıcıya SDK yüklenmez: müşteri menüsünün JavaScript bütçesi etkilenmez.

const dsn = process.env.SENTRY_DSN;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0,
    // Kişisel veri toplanmaz (Sentry v11 `dataCollection`).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      databaseQueryData: false,
      stackFrameVariables: false,
    },
    // Ek güvence: çerez, başlık, IP ve sorgu parametreleri gönderilmeden önce silinir.
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.query_string;
        delete event.request.data;
      }
      delete event.user;
      return event;
    },
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const err = error as Error & { digest?: string };
  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      message: err.message,
      digest: err.digest,
      stack: err.stack?.split("\n").slice(0, 8).join("\n"),
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      routeType: context.routeType,
    }),
  );
  if (dsn) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureRequestError(error, { ...request, headers: {} }, context);
  }
};
