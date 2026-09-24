// Hata ve boş durum ekranlarının ortak düzeni (404, menü bulunamadı, beklenmeyen hata).
// Nötr renkler: tema veya panel teması yüklenmemiş olabilir.

export function StatusScreen({
  icon,
  title,
  description,
  secondary,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Turistler için İngilizce satır gibi ikincil metin */
  secondary?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-5 bg-stone-50 px-8 text-center text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <span className="flex size-18 items-center justify-center rounded-3xl border border-stone-200 bg-white text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        {icon}
      </span>
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-stone-600 dark:text-stone-400">{description}</p>
      </div>
      {secondary && (
        <p className="max-w-sm text-sm text-stone-600 dark:text-stone-400">
          {secondary}
        </p>
      )}
      {action}
    </main>
  );
}

export const statusActionClass =
  "flex h-11 items-center rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-900";
