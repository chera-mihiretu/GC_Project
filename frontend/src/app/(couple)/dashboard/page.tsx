"use client";

import { useSession } from "@/lib/auth-client";
import StatCard from "@/components/ui/stat-card";
import {
  FiDollarSign,
  FiCheckSquare,
  FiUsers,
  FiShoppingBag,
  FiArrowRight,
  FiCalendar,
  FiSearch,
  FiClock,
} from "react-icons/fi";
import Link from "next/link";

const quickActions = [
  {
    title: "Budget Planner",
    description: "Track spending and stay on target",
    icon: FiDollarSign,
    href: "/budget",
    ready: false,
  },
  {
    title: "Checklist",
    description: "Manage your wedding to-do list",
    icon: FiCheckSquare,
    href: "/checklist",
    ready: false,
  },
  {
    title: "Guest List",
    description: "Organize invitations and RSVPs",
    icon: FiUsers,
    href: "/guests",
    ready: false,
  },
  {
    title: "Find Vendors",
    description: "Browse verified wedding vendors",
    icon: FiSearch,
    href: "/vendors",
    ready: true,
  },
];

export default function CoupleDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-[family-name:var(--font-display)]">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Let&apos;s make your special day perfect.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiDollarSign}
          label="Total Budget"
          value="$0"
          subtext="Not set yet"
          color="green"
        />
        <StatCard
          icon={FiCheckSquare}
          label="Tasks"
          value="0 / 0"
          subtext="No tasks yet"
          color="blue"
        />
        <StatCard
          icon={FiUsers}
          label="Guests"
          value="0"
          subtext="No guests added"
          color="amber"
        />
        <StatCard
          icon={FiShoppingBag}
          label="Vendors Booked"
          value="0"
          subtext="Start browsing"
          color="rose"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const content = (
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 flex items-center gap-4 group hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {action.title}
                    </h3>
                    {!action.ready && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
                <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </div>
            );

            if (action.ready) {
              return (
                <Link key={action.title} href={action.href}>
                  {content}
                </Link>
              );
            }
            return <div key={action.title}>{content}</div>;
          })}
        </div>
      </div>

      {/* Timeline placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Wedding Timeline
        </h2>
        <div className="bg-white rounded-xl border border-gray-200/80 border-dashed p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FiCalendar className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Your timeline will appear here
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Set your wedding date and start adding tasks to see your planning
            timeline come to life.
          </p>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="bg-white rounded-xl border border-gray-200/80 p-8 text-center">
          <FiClock className="w-6 h-6 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            Your recent planning activity will show up here.
          </p>
        </div>
      </div>
    </div>
  );
}
