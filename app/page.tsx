
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
  ArrowLeftRight,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  background: string;
  tag?: string;
};

const features: Feature[] = [
  {
    title: "Dashboard",
    description:
      "See your financial activity, key metrics, and money overview.",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
    tag: "Overview",
  },
  {
    title: "Transactions",
    description:
      "Track, organize, and manage your income and expenses.",
    href: "/transactions",
    icon: ArrowLeftRight,
    color: "text-blue-400",
    background: "bg-blue-500/10",
  },
  {
    title: "Budget Management",
    description:
      "Create monthly budgets and monitor spending limits.",
    href: "/budget",
    icon: Wallet,
    color: "text-violet-400",
    background: "bg-violet-500/10",
  },
  {
    title: "Savings Goals",
    description:
      "Set financial goals, track progress, and optimize savings.",
    href: "/savings",
    icon: Target,
    color: "text-amber-400",
    background: "bg-amber-500/10",
  },
  {
    title: "Financial Reports",
    description:
      "Explore cash flow, expense trends, and downloadable reports.",
    href: "/reports",
    icon: PieChart,
    color: "text-cyan-400",
    background: "bg-cyan-500/10",
  },
  {
    title: "AI Financial Insights",
    description:
      "Explore smart categorization, forecasts, and anomaly insights.",
    href: "/dashboard",
    icon: BrainCircuit,
    color: "text-pink-400",
    background: "bg-pink-500/10",
    tag: "AI Powered",
  },
];

const highlights = [
  {
    icon: BrainCircuit,
    title: "AI-Powered Intelligence",
    description:
      "Understand spending patterns with intelligent financial analysis.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    description:
      "Your financial records are protected by authenticated access.",
  },
  {
    icon: TrendingUp,
    title: "Data-Driven Decisions",
    description:
      "Use visual reports and historical trends to plan with confidence.",
  },
];

export default function HomePage() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) {
        setIsLoggedIn(Boolean(user));
        setCheckingAuth(false);
      }
    }

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setIsLoggedIn(Boolean(session?.user));
          setCheckingAuth(false);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    setIsLoggedIn(false);
    setMenuOpen(false);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#070d19] text-white overflow-x-hidden">
      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-[600px] right-[-180px] h-[450px] w-[450px] rounded-full bg-blue-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10">
        {/* NAVBAR */}

        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070d19]/85 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-[#07111a]">
                <ChartNoAxesCombined size={22} strokeWidth={2.5} />
              </div>

              <span className="text-xl font-bold tracking-tight">
                Fin<span className="text-emerald-400">Sight</span>
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Features
              </a>

              <a
                href="#why-finsight"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Why FinSight
              </a>

              <Link
                href="/reports"
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Reports
              </Link>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {!checkingAuth &&
                (isLoggedIn ? (
                  <>
                    <button
                      onClick={handleLogout}
                      className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                      Log Out
                    </button>

                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#07111a] transition hover:bg-emerald-400"
                    >
                      Dashboard
                      <ArrowUpRight size={16} />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2.5 text-sm text-slate-300 transition hover:text-white"
                    >
                      Log In
                    </Link>

                    <Link
                      href="/signup"
                      className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#07111a] transition hover:bg-emerald-400"
                    >
                      Get Started
                    </Link>
                  </>
                ))}
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              className="rounded-lg border border-white/10 p-2 text-slate-300 md:hidden"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </nav>

          {/* MOBILE MENU */}

          {menuOpen && (
            <div className="border-t border-white/10 bg-[#0b1424] px-5 py-5 md:hidden">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-slate-300"
                >
                  Features
                </a>

                <a
                  href="#why-finsight"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-slate-300"
                >
                  Why FinSight
                </a>

                <Link
                  href="/reports"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-slate-300"
                >
                  Reports
                </Link>

                <div className="border-t border-white/10 pt-4">
                  {isLoggedIn ? (
                    <div className="flex gap-3">
                      <Link
                        href="/dashboard"
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#07111a]"
                      >
                        Dashboard
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                      >
                        Log Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href="/login"
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm"
                      >
                        Log In
                      </Link>

                      <Link
                        href="/signup"
                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#07111a]"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </header>

        {/* HERO */}

        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-20 sm:px-8 lg:grid-cols-2 lg:px-10 lg:pb-28 lg:pt-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300">
              <Sparkles size={14} />
              AI-POWERED PERSONAL FINANCE
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Money.
              <br />
              Your Goals.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Your Financial Future.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              Take control of your finances with intelligent
              expense tracking, smart budgets, savings goals,
              and AI-driven insights — all in one powerful
              workspace.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-7 py-4 font-semibold text-[#07111a] shadow-lg shadow-emerald-500/15 transition hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                {isLoggedIn ? "Open Dashboard" : "Get Started Free"}
                <ArrowRight size={19} />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-4 font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/5"
              >
                Explore Features
                <ChevronRight size={18} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-400" />
                Secure Access
              </span>

              <span className="flex items-center gap-2">
                <Zap size={17} className="text-emerald-400" />
                Smart Analytics
              </span>

              <span className="flex items-center gap-2">
                <BarChart3 size={17} className="text-emerald-400" />
                Real-Time Data
              </span>
            </div>
          </div>

          {/* HERO VISUAL - DEMO DATA */}

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 blur-3xl" />

            <div className="relative rounded-3xl border border-white/10 bg-[#111c2e] p-5 shadow-2xl shadow-black/30 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    FINANCIAL OVERVIEW
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Your money at a glance
                  </h3>
                </div>

                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                  <BarChart3 size={22} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/5 bg-[#0a1322] p-4">
                  <p className="text-xs text-slate-400">
                    Monthly Income
                  </p>
                  <p className="mt-3 text-xl font-bold text-emerald-400 sm:text-2xl">
                    ₹65,000
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Example data
                  </p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-[#0a1322] p-4">
                  <p className="text-xs text-slate-400">
                    Monthly Expenses
                  </p>
                  <p className="mt-3 text-xl font-bold text-white sm:text-2xl">
                    ₹38,500
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Example data
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/5 bg-[#0a1322] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Spending Analysis
                  </span>
                  <span className="text-xs text-slate-500">
                    Sample
                  </span>
                </div>

                <div className="mt-7 flex h-36 items-end justify-between gap-3">
                  {[
                    { label: "May", height: 45 },
                    { label: "Jun", height: 68 },
                    { label: "Jul", height: 58 },
                    { label: "Aug", height: 85 },
                    { label: "Sep", height: 63 },
                    { label: "Oct", height: 78 },
                  ].map((bar) => (
                    <div
                      key={bar.label}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-3"
                    >
                      <div
                        className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400"
                        style={{ height: `${bar.height}%` }}
                      />
                      <span className="text-[10px] text-slate-500 sm:text-xs">
                        {bar.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <TrendingUp size={17} />
                  Cash-flow savings rate
                </div>

                <span className="font-bold text-emerald-400">
                  40.8%
                </span>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                Illustrative preview — open your dashboard for live data.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES */}

        <section
          id="features"
          className="border-t border-white/5 bg-[#0a1220] py-20 sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                Your Financial Workspace
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need.
                <br />
                <span className="text-slate-400">
                  All in one place.
                </span>
              </h2>

              <p className="mt-4 max-w-2xl text-slate-400">
                Jump directly into any FinSight feature and
                manage your finances from one central hub.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Link
                    key={feature.title}
                    href={feature.href}
                    className="group relative rounded-2xl border border-white/10 bg-[#111c2e] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:bg-[#152238] hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.background} ${feature.color}`}
                      >
                        <Icon size={24} />
                      </div>

                      <ArrowUpRight
                        size={20}
                        className="text-slate-600 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-emerald-400"
                      />
                    </div>

                    {feature.tag && (
                      <span className="mb-3 inline-block rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                        {feature.tag}
                      </span>
                    )}

                    <h3 className="text-lg font-bold text-white">
                      {feature.title}
                    </h3>

                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
                      {feature.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-400">
                      Open Feature
                      <ArrowRight
                        size={16}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="mt-5 text-xs text-slate-500">
              AI Insights currently opens the Dashboard,
              where your existing ML features are available.
              You can update that link if you create a
              dedicated AI Insights route.
            </p>
          </div>
        </section>

        {/* WHY FINSIGHT */}

        <section
          id="why-finsight"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-24"
        >
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Why FinSight?
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Smarter money management
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Built to help you understand your finances,
              identify opportunities, and make informed decisions.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-[#111c2e]/70 p-7 text-center"
                >
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <Icon size={26} />
                  </div>

                  <h3 className="text-lg font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}

        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900/40 via-[#102b30] to-[#10223b] px-6 py-14 text-center sm:px-12">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <CircleDollarSign
                size={36}
                className="mx-auto text-emerald-400"
              />

              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Ready to take control?
              </h2>

              <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
                Bring your transactions, budgets, savings,
                and financial insights together with FinSight.
              </p>

              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="mt-8 inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-7 py-4 font-semibold text-[#07111a] transition hover:bg-emerald-400"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start with FinSight"}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}

        <footer className="border-t border-white/10 bg-[#070d19]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row lg:px-10">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombined
                size={20}
                className="text-emerald-400"
              />

              <span className="font-bold">
                Fin<span className="text-emerald-400">Sight</span>
              </span>
            </div>

            <p className="text-center text-xs text-slate-500">
              © {new Date().getFullYear()} FinSight.
              Built for smarter financial decisions.
            </p>

            <div className="flex items-center gap-5 text-sm text-slate-400">
              <Link
                href="/dashboard"
                className="hover:text-emerald-400"
              >
                Dashboard
              </Link>

              <Link
                href="/reports"
                className="hover:text-emerald-400"
              >
                Reports
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
