"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, LockKeyhole, Mail, ShieldCheck, TrendingUp, UserRound } from "lucide-react";
import { supabase } from "@/supabase";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setMessage("Account created successfully!");
    }

    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070d19] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-28 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070d19_75%)]" />
      </div>

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101b2d]/95 shadow-2xl shadow-black/30 lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-white/10 bg-gradient-to-br from-[#102b2b] via-[#0c2230] to-[#0d192b] p-10 lg:flex">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold tracking-tight">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-400">
                <BarChart3 className="h-6 w-6" />
              </span>
              Fin<span className="text-emerald-400">Sight</span>
            </Link>
            <div className="mt-20">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
                <TrendingUp className="h-3.5 w-3.5" /> BUILD YOUR FINANCIAL FUTURE
              </span>
              <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
                Take control of your money <span className="text-emerald-400">with confidence.</span>
              </h2>
              <p className="mt-5 max-w-sm leading-7 text-slate-300">
                Organize transactions, build smarter budgets, set savings goals, and uncover useful financial insights.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-slate-300">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Your personal finance workspace
          </div>
        </div>

        <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-xl font-bold lg:hidden">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Fin<span className="text-emerald-400">Sight</span>
          </Link>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">Get started</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Create your account</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Start your journey toward clearer, smarter financial planning.
          </p>

          <form onSubmit={handleSignup} className="mt-9 space-y-5">
            <div>
              <label htmlFor="signup-name" className="mb-2 block text-sm font-medium text-slate-200">
                Full name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/10 bg-[#0a1322] py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Use at least 6 characters.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 font-semibold text-[#07120f] shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {message && (
            <p
              role="status"
              className={`mt-6 rounded-xl border px-4 py-3 text-center text-sm ${
                message === "Account created successfully!"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-emerald-400 transition hover:text-emerald-300">
              Sign in
            </Link>
          </p>
          <p className="mt-5 text-center text-xs text-slate-500">
            <Link href="/" className="transition hover:text-slate-300">Back to FinSight home</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
