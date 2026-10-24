
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email and password login
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Google OAuth login
  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage(error.message);
        setGoogleLoading(false);
      }
      // On success, Supabase redirects the browser to Google.
    } catch (error) {
      console.error("Google login error:", error);
      setMessage("Unable to connect to Google. Please try again.");
      setGoogleLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070d19] px-4 py-12 text-white sm:px-6 lg:px-8">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-28 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070d19_75%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101b2d]/95 shadow-2xl shadow-black/30 lg:grid-cols-2">
        {/* Left branding panel */}
        <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-[#102b2b] via-[#0c2230] to-[#0d192b] p-10 lg:flex">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
                <BarChart3 className="h-6 w-6" />
              </span>
              Fin<span className="text-emerald-400">Sight</span>
            </Link>

            <div className="mt-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" />
                YOUR FINANCIAL COMMAND CENTER
              </span>

              <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
                Smarter money decisions{" "}
                <span className="text-emerald-400">
                  start here.
                </span>
              </h2>

              <p className="mt-5 max-w-sm leading-7 text-slate-300">
                Track spending, plan budgets, grow savings, and
                explore intelligent financial insights in one place.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Your personal finance workspace
          </div>
        </div>

        {/* Right login panel */}
        <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 text-xl font-bold lg:hidden"
          >
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Fin<span className="text-emerald-400">Sight</span>
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Welcome back
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Sign in to FinSight
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Enter your credentials or continue with Google
            to access your financial dashboard.
          </p>

          {/* Email login form */}
          <form onSubmit={handleLogin} className="mt-9 space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={busy}
                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-[#052019] shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Or continue with
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google login button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-5 py-3.5 font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.82 7.18l7.73 6C44.36 38.03 46.98 31.87 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.8 23.8 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            {googleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </button>

          {/* Error message */}
          {message && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {message}
            </p>
          )}

          {/* Signup link */}
          <p className="mt-8 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-emerald-400 transition hover:text-emerald-300"
            >
              Create an account
            </Link>
          </p>

          {/* Home link */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-slate-300"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
