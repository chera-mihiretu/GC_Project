"use client";

import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/layouts/dashboard-shell";
import type { NavItem } from "@/components/layouts/dashboard-shell";
import { SocketProvider } from "@/components/realtime/socket-provider";
import {
  FiGrid,
  FiHeart,
  FiDollarSign,
  FiCheckSquare,
  FiUsers,
  FiSearch,
  FiCalendar,
  FiMessageSquare,
  FiSettings,
} from "react-icons/fi";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FiGrid },
  { label: "Wedding Profile", href: "/profile", icon: FiHeart },
  { label: "Budget", href: "/budget", icon: FiDollarSign },
  { label: "Checklist", href: "/checklist", icon: FiCheckSquare },
  { label: "Guest List", href: "/guests", icon: FiUsers },
  { label: "Find Vendors", href: "/vendors", icon: FiSearch },
  { label: "My Bookings", href: "/bookings", icon: FiCalendar },
  { label: "Messages", href: "/messages", icon: FiMessageSquare },
  { label: "Settings", href: "/settings", icon: FiSettings },
];

export default function CoupleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["couple", "user"]}>
      <SocketProvider>
        <DashboardShell navItems={navItems} roleLabel="Couple" accentColor="rose">
          {children}
        </DashboardShell>
      </SocketProvider>
    </AuthGuard>
  );
}
