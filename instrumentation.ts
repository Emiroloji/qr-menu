import type { Instrumentation } from "next";

/**
 * Sunucu hataları tek satırlık JSON olarak kaydedilir (docker logs / journald ile okunur).
 * Kişisel veri yazılmaz: yalnızca yol, yöntem, rota ve hata bilgisi.
 * Harici bir hata izleme servisi (Sentry vb.) seçildiğinde buraya bağlanır.
 */
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
};
