
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PieChart,
  Home,
} from "lucide-react";

const links = [
  { name: "Home", href: "/", icon: Home },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Budgets", href: "/budget", icon: Wallet },
  { name: "Savings", href: "/savings", icon: Target },
  { name: "Reports", href: "/reports", icon: PieChart },
];

export default function FinSightNavbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#070d19]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-xl bg-emerald-500 p-2 text-[#07111a]">
            <ChartNoAxesCombined size={20} />
          </div>

          <span className="text-lg font-bold text-white">
            Fin<span className="text-emerald-400">Sight</span>
          </span>
        </Link>

        <div className="flex max-w-full items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
