import { ChevronRightIcon, MapPinIcon } from "lucide-react";

/** İşletmenin alan adının ana sayfası, birden çok şube varsa (Faz 3.2). */
export function BranchChooser({
  businessName,
  branches,
}: {
  businessName: string;
  branches: { slug: string; name: string }[];
}) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-stone-50 px-6 py-12 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <h1 dir="auto" className="text-center text-2xl font-bold tracking-tight">
        {businessName}
      </h1>
      <ul className="flex w-full max-w-sm flex-col gap-2">
        {branches.map((branch) => (
          <li key={branch.slug}>
            <a
              href={`/${branch.slug}`}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 font-medium dark:border-stone-800 dark:bg-stone-900"
            >
              <MapPinIcon className="size-5 text-stone-500" aria-hidden />
              <span dir="auto" className="flex-1">
                {branch.name}
              </span>
              <ChevronRightIcon
                className="size-5 text-stone-400 rtl:rotate-180"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
