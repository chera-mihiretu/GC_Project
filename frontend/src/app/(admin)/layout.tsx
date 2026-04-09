"use client";

import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/layouts/dashboard-shell";
import type { NavItem } from "@/components/layouts/dashboard-shell";
import {
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiBarChart2,
  FiSettings,
} from "react-icons/fi";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: FiGrid },
  { label: "Vendors", href: "/admin/vendors", icon: FiShoppingBag },
  { label: "Users", href: "/admin/users", icon: FiUsers },
  { label: "Reports", href: "/admin/reports", icon: FiBarChart2 },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <DashboardShell navItems={navItems} roleLabel="Admin" accentColor="amber">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
