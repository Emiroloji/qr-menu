/** İskelet ekran: tema henüz bilinmediği için nötr renkler; boş beyaz ekran yok (KURALLAR 8). */
export default function MenuLoading() {
  const bar = "rounded-md bg-stone-200 dark:bg-stone-800";
  return (
    <div
      role="status"
      aria-label="Menü yükleniyor"
      className="flex min-h-dvh flex-1 animate-pulse flex-col gap-5 bg-stone-50 px-5 pt-5 motion-reduce:animate-none dark:bg-stone-950"
    >
      <div className="flex items-center gap-3">
        <div className={`size-13 rounded-2xl ${bar}`} />
        <div className="flex flex-1 flex-col gap-2">
          <div className={`h-5 w-40 ${bar}`} />
          <div className={`h-4 w-24 ${bar}`} />
        </div>
      </div>
      <div className="flex gap-2">
        {["w-28", "w-20", "w-24"].map((w) => (
          <div key={w} className={`h-9 rounded-full ${w} ${bar}`} />
        ))}
      </div>
      <div className="flex gap-2 border-b border-stone-200 pb-3 dark:border-stone-800">
        {["w-24", "w-32", "w-20", "w-28"].map((w) => (
          <div key={w} className={`h-10 rounded-full ${w} ${bar}`} />
        ))}
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3.5 border-b border-stone-200 py-2 dark:border-stone-800"
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className={`h-4 w-32 ${bar}`} />
            <div className={`h-3.5 w-full ${bar}`} />
            <div className={`h-3.5 w-2/3 ${bar}`} />
            <div className={`h-4 w-16 ${bar}`} />
          </div>
          <div className={`size-24 shrink-0 rounded-2xl ${bar}`} />
        </div>
      ))}
    </div>
  );
}
