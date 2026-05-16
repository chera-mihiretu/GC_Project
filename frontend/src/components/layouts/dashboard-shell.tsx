"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronRight,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import NotificationBell from "@/components/realtime/notification-bell";

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

const ACCENT_MAP: Record<
  string,
  {
    activeBg: string;
    activeText: string;
    activeBorder: string;
    badge: string;
    logoBg: string;
    logoGlow: string;
    indicator: string;
  }
> = {
  rose: {
    activeBg: "bg-rose-500/[0.07]",
    activeText: "text-rose-400",
    activeBorder: "border-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    logoBg: "from-rose-400 to-rose-600",
    logoGlow: "shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    indicator: "bg-rose-400",
  },
  blue: {
    activeBg: "bg-blue-500/[0.07]",
    activeText: "text-blue-400",
    activeBorder: "border-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    logoBg: "from-blue-400 to-blue-600",
    logoGlow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    indicator: "bg-blue-400",
  },
  amber: {
    activeBg: "bg-amber-500/[0.07]",
    activeText: "text-amber-400",
    activeBorder: "border-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    logoBg: "from-amber-400 to-amber-600",
    logoGlow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    indicator: "bg-amber-400",
  },
};

export default function DashboardShell({
  children,
  navItems,
  roleLabel,
  accentColor = "rose",
}: DashboardShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const accent = ACCENT_MAP[accentColor] ?? ACCENT_MAP.rose;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === pathname) return true;
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    return false;
  }

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email ?? "";
  const userInitial = userName.charAt(0).toUpperCase();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // Proceed regardless
    }
    window.location.href = "/login";
  }

  /* ═══════════════════════ Sidebar Content ═══════════════════════ */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo area ── */}
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${accent.logoBg} rounded-xl flex items-center justify-center ${accent.logoGlow}`}>
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div>
            <span className="text-[15px] font-bold text-white tracking-tight">
              Twedar
            </span>
            <span className={`ml-2 text-[9px] font-semibold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded border ${accent.badge}`}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                active
                  ? `${accent.activeBg} ${accent.activeText}`
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              {/* Active indicator bar */}
              {active && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${accent.indicator}`} />
              )}
              <Icon className="w-[17px] h-[17px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ── */}
      <div className="px-3 pb-5 pt-3 border-t border-white/[0.06] mt-2">
        {/* User mini-card */}
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] mb-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent.logoBg} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-300 truncate">{userName}</p>
            <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="cursor-pointer flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-300"
        >
          <FiLogOut className="w-[17px] h-[17px]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-warm-50 flex">
      {/* ═══════ Desktop Sidebar ═══════ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[260px] bg-[#0c0b09] fixed inset-y-0 left-0 z-30 border-r border-white/[0.04]">
        {sidebarContent}
      </aside>

      {/* ═══════ Mobile Overlay ═══════ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════ Mobile Sidebar ═══════ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#0c0b09] border-r border-white/[0.04] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="cursor-pointer absolute top-6 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-white hover:bg-white/[0.06] transition-all duration-300"
        >
          <FiX className="w-4.5 h-4.5" />
        </button>
        {sidebarContent}
      </aside>

      {/* ═══════ Main Content Area ═══════ */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen">
        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-warm-200/40">
          <div className="flex items-center justify-between px-5 sm:px-8 h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="cursor-pointer lg:hidden w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-warm-100 transition-all duration-300"
              >
                <FiMenu className="w-[18px] h-[18px]" />
              </button>

              {/* Breadcrumb / current page */}
              <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-400">
                <span className="font-medium text-slate-500">{roleLabel}</span>
                <FiChevronRight className="w-3 h-3 text-slate-300" />
                <span className="font-medium text-slate-700">
                  {navItems.find((i) => isActive(i.href))?.label ?? "Page"}
                </span>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <NotificationBell />

              {/* User avatar + menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="cursor-pointer flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-xl hover:bg-warm-50 transition-all duration-300"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-[13px] font-medium text-slate-700 leading-tight">
                      {userName}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {userEmail}
                    </p>
                  </div>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent.logoBg} flex items-center justify-center text-white text-sm font-bold ${accent.logoGlow}`}>
                    {userInitial}
                  </div>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.1)] border border-warm-200/50 py-2 animate-scale-reveal origin-top-right">
                    <div className="px-4 py-3 border-b border-warm-200/30">
                      <p className="text-[13px] font-medium text-slate-800 truncate">{userName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSignOut();
                        }}
                        className="cursor-pointer w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                      >
                        <FiLogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
