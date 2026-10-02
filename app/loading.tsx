export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-6" aria-busy="true" aria-label="Loading performance data">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded bg-slate-200" />
          <div className="h-4 w-36 rounded bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-slate-200" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 h-9 w-40 rounded bg-slate-200" />
        <div className="h-72 rounded-lg bg-slate-100" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
