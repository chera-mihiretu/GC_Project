"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FiMenu, FiX, FiLogOut, FiHeart } from "react-icons/fi";
import type { IconType } from "react-icons";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  roleLabel: string;
  accentColor?: string;
}

export default function DashboardShell({
  children,
  navItems,
  roleLabel,
  accentColor = "rose",
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const accentMap: Record<string, { active: string; badge: string; hover: string }> = {
    rose: {
      active: "bg-rose-500/10 text-rose-400 border-rose-500",
      badge: "bg-rose-500/15 text-rose-400",
      hover: "hover:bg-white/5",
    },
    blue: {
      active: "bg-blue-500/10 text-blue-400 border-blue-500",
      badge: "bg-blue-500/15 text-blue-400",
      hover: "hover:bg-white/5",
    },
    amber: {
      active: "bg-amber-500/10 text-amber-400 border-amber-500",
      badge: "bg-amber-500/15 text-amber-400",
      hover: "hover:bg-white/5",
    },
  };

  const accent = accentMap[accentColor] ?? accentMap.rose;

  function isActive(href: string) {
    if (href === pathname) return true;
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    return false;
  }

  const sidebarContent = (
    <>
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center text-white">
          <FiHeart className="w-4 h-4" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          Twedar
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? `${accent.active} border-l-2`
                  : `text-slate-400 ${accent.hover} border-l-2 border-transparent`
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5">
        <button
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors"
        >
          <FiLogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-slate-900 fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-slate-900 flex flex-col transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-5 right-3 text-slate-400 hover:text-white p-1"
        >
          <FiX className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <span
                className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${accent.badge}`}
              >
                {roleLabel}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="text-xs text-gray-400">
                  {session?.user?.email ?? ""}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-sm font-bold">
                {(session?.user?.name ?? "U").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
