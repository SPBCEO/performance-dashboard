export default function Loading() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Loading performance data">
      <div className="h-10 w-48 rounded bg-surface-container-high" />
      <div className="h-[52px] rounded-xl bg-surface-container-lowest" />
      <div className="h-40 rounded-xl bg-surface-container-low" />
      <div className="h-64 rounded-xl bg-surface-container-low" />
      {[0, 1].map((i) => (
        <div key={i} className="h-36 rounded-xl bg-surface-container-low" />
      ))}
    </div>
  );
}
