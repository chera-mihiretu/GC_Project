"use client";

import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/layouts/dashboard-shell";
import type { NavItem } from "@/components/layouts/dashboard-shell";
import { SocketProvider } from "@/components/realtime/socket-provider";
import {
  FiGrid,
  FiDollarSign,
  FiCheckSquare,
  FiUsers,
  FiSearch,
  FiMessageSquare,
} from "react-icons/fi";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: FiGrid },
  { label: "Budget", href: "/budget", icon: FiDollarSign },
  { label: "Checklist", href: "/checklist", icon: FiCheckSquare },
  { label: "Guest List", href: "/guests", icon: FiUsers },
  { label: "Find Vendors", href: "/vendors", icon: FiSearch },
  { label: "Messages", href: "/messages", icon: FiMessageSquare },
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
