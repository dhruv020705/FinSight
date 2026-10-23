
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";
import { supabase } from "@/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] =
    useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setRequiresVerification(false);

    try {
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
        setMessageType("error");
        setMessage(error.message);
        return;
      }

      if (data.session) {
        setMessageType("success");
        setMessage("Account created successfully! Redirecting...");

        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (data.user) {
        setMessageType("success");
        setRequiresVerification(true);
        setMessage(
          "Account created successfully! Please check your email to verify your account before logging in."
        );
      } else {
        setMessageType("error");
        setMessage("Unable to create your account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setMessageType("error");
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-[#0a1322] " +
    "py-3.5 pl-12 pr-4 text-sm text-white " +
    "placeholder:text-slate-500 outline-none transition-all " +
    "focus:border-emerald-400/60 focus:ring-2 " +
    "focus:ring-emerald-500/10";

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#070d19] text-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute -bottom-48 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[140px]" />
      </div>

      {/* Left branding panel */}
      <section className="relative hidden min-h-screen w-1/2 flex-col justify-between border-r border-white/10 bg-[#0a1423]/70 px-12 py-10 lg:flex xl:px-20">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-[#07111b] shadow-lg shadow-emerald-500/20">
            <Wallet size={23} strokeWidth={2.4} />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            Fin<span className="text-emerald-400">Sight</span>
          </span>
        </Link>

        <div className="relative max-w-lg">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-medium text-emerald-300">
            <Sparkles size={15} />
            Smarter financial decisions start here
          </div>

          <h1 className="text-5xl font-bold leading-[1.15] tracking-tight xl:text-6xl">
            Take control of
            <br />
            your <span className="text-emerald-400">financial</span>
            <br />
            future.
          </h1>

          <p className="mt-7 max-w-md text-base leading-8 text-slate-400">
            Track your spending, discover intelligent insights,
            build better budgets, and achieve your savings goals
            with FinSight.
          </p>

          <div className="mt-12 grid max-w-md gap-5">
            {[
              {
                title: "Intelligent expense tracking",
                description: "Organize transactions with ML-powered insights.",
              },
              {
                title: "Smarter budgeting",
                description: "Monitor spending and plan your money confidently.",
              },
              {
                title: "Savings optimization",
                description: "Turn financial goals into actionable plans.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                  <CheckCircle2 size={19} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} FinSight. Your finances, simplified.
        </p>
      </section>

      {/* Right signup panel */}
      <section className="relative flex min-h-screen w-full flex-col px-5 py-8 sm:px-10 lg:w-1/2 lg:px-14 xl:px-24">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 lg:hidden"
          >
            <Wallet className="text-emerald-400" size={22} />
            <span className="font-bold">
              Fin<span className="text-emerald-400">Sight</span>
            </span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
                <UserRound className="text-emerald-400" size={23} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create your account
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Join FinSight and start making smarter financial decisions.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              {/* Full name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    minLength={6}
                    className={inputClass}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Password must contain at least 6 characters.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-bold text-[#07111b] shadow-lg shadow-emerald-500/15 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#07111b]/30 border-t-[#07111b]" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Signup feedback */}
            {message && (
              <div
                role={messageType === "error" ? "alert" : "status"}
                className={`mt-6 rounded-xl border px-4 py-4 text-sm leading-6 ${
                  messageType === "error"
                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  {messageType === "success" && (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p>{message}</p>
                    {requiresVerification && (
                      <Link
                        href="/login"
                        className="mt-3 inline-flex items-center gap-2 font-semibold underline underline-offset-4 hover:text-emerald-200"
                      >
                        Go to Login
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-400 transition hover:text-emerald-300"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-10 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-500">
              <ShieldCheck size={16} className="text-emerald-400" />
              Secure authentication powered by Supabase
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
