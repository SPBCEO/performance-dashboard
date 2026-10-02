export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="pt-safe pb-safe mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={40} height={40} className="h-10 w-10" />
        <div>
          <div className="label-caps text-primary">Turnover</div>
          <div className="font-headline text-xl font-semibold text-on-surface">Performance Dashboard</div>
        </div>
      </div>
      {children}
    </main>
  );
}
