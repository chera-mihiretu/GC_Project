"use client";

import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/layouts/dashboard-shell";
import type { NavItem } from "@/components/layouts/dashboard-shell";
import { SocketProvider } from "@/components/realtime/socket-provider";
import {
  FiGrid,
  FiUser,
  FiUsers,
  FiCalendar,
  FiClock,
  FiFileText,
  FiImage,
  FiMessageSquare,
  FiSettings,
} from "react-icons/fi";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: FiGrid },
  { label: "Profile", href: "/vendor/profile/setup", icon: FiUser },
  { label: "Team", href: "/vendor/team", icon: FiUsers },
  { label: "Bookings", href: "/vendor/bookings", icon: FiCalendar },
  { label: "Availability", href: "/vendor/availability", icon: FiClock },
  { label: "Documents", href: "/vendor/documents", icon: FiFileText },
  { label: "Portfolio", href: "/vendor/portfolio", icon: FiImage },
  { label: "Messages", href: "/vendor/messages", icon: FiMessageSquare },
  { label: "Settings", href: "/vendor/settings", icon: FiSettings },
];

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["vendor"]}>
      <SocketProvider>
        <DashboardShell navItems={navItems} roleLabel="Vendor" accentColor="blue">
          {children}
        </DashboardShell>
      </SocketProvider>
    </AuthGuard>
  );
}
