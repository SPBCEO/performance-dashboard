"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeNext } from "@/lib/next-path";

const field =
  "mt-1 block min-h-[48px] w-full rounded-lg border border-white/10 bg-surface-container-lowest px-3 text-base text-on-surface focus:border-primary focus:outline-none";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const target = safeNext(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setError("Email or password is incorrect.");
        setBusy(false);
        return;
      }
      router.replace(target);
      router.refresh();
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}` },
    });
    if (error) {
      setError(error.message);
    } else if (data.session) {
      router.replace(target);
      router.refresh();
      return;
    } else {
      setNotice("Check your inbox and click the confirmation link, then sign in.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-surface-container-low p-5 ring-1 ring-white/5">
      <h1 className="font-headline text-2xl font-semibold text-on-surface">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
      <p className="mb-4 mt-1 text-sm text-on-surface-variant">
        {mode === "in" ? "Sign in to your team's dashboard." : "Then create a team or join one with an invite link."}
      </p>
      <label className="block text-xs font-medium text-on-surface-variant">
        Email
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
      </label>
      <label className="mt-3 block text-xs font-medium text-on-surface-variant">
        Password
        <input
          type="password"
          required
          minLength={mode === "up" ? 8 : undefined}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-error-container/50 px-3 py-2 text-sm text-on-error-container">{error}</p> : null}
      {notice ? <p role="status" className="mt-3 rounded-lg bg-tertiary/15 px-3 py-2 text-sm text-tertiary">{notice}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 min-h-[48px] w-full rounded-full bg-primary-container text-sm font-semibold text-on-primary-container hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
      </button>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setError(null);
          setNotice(null);
        }}
        className="mt-3 min-h-[44px] w-full text-sm font-semibold text-primary"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
