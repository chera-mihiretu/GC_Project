"use client";

import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/layouts/dashboard-shell";
import type { NavItem } from "@/components/layouts/dashboard-shell";
import {
  FiGrid,
  FiUser,
  FiFileText,
  FiImage,
  FiMessageSquare,
} from "react-icons/fi";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: FiGrid },
  { label: "Profile", href: "/vendor/profile/setup", icon: FiUser },
  { label: "Documents", href: "/vendor/documents", icon: FiFileText },
  { label: "Portfolio", href: "/vendor/portfolio", icon: FiImage },
  { label: "Messages", href: "/vendor/messages", icon: FiMessageSquare },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["vendor"]}>
      <DashboardShell navItems={navItems} roleLabel="Vendor" accentColor="blue">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
