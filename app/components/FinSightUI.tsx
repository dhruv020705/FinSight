"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
} from "lucide-react";

export function FinSightPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#070d19] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        {children}
      </div>
    </main>
  );
}

export function FinSightHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <header className="mb-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-emerald-400"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold">
          <ChartNoAxesCombined
            size={20}
            className="text-emerald-400"
          />
          Fin<span className="text-emerald-400">Sight</span>
        </div>
      </div>

      {badge && (
        <span className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-300">
          {badge}
        </span>
      )}

      <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-2xl text-slate-400">
        {description}
      </p>
    </header>
  );
}

export function FinSightCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#111c2e] p-5 shadow-xl shadow-black/10 sm:p-6 ${className}`}
    >
      {(title || description) && (
        <div className="mb-5">
          {title && (
            <h2 className="text-lg font-semibold text-white">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-2 text-sm text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

export function FinSightStat({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111c2e] p-5 transition hover:border-emerald-500/30">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        {icon && (
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            {icon}
          </div>
        )}
      </div>

      <p className="mt-4 break-words text-2xl font-bold text-white">
        {value}
      </p>

      {trend && (
        <p className="mt-3 text-xs text-emerald-400">
          {trend}
        </p>
      )}
    </div>
  );
}

export function FinSightButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#07111a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}