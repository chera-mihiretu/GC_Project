"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getCoupleProfile, type CoupleProfile } from "@/services/couple.service";
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
  FiHeart,
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
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const fetchCoupleProfile = useCallback(async () => {
    try {
      const data = await getCoupleProfile();
      setCoupleProfile(data?.coupleProfile ?? null);
    } catch {
      // Profile doesn't exist yet
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchCoupleProfile();
  }, [fetchCoupleProfile]);

  const daysUntilWedding = coupleProfile?.weddingDate
    ? Math.ceil((new Date(coupleProfile.weddingDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
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
          value={coupleProfile?.estimatedGuests != null ? String(coupleProfile.estimatedGuests) : "0"}
          subtext={coupleProfile?.estimatedGuests != null ? "Estimated" : "No guests added"}
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
                <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
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
                <FiArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
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

      {/* Wedding profile CTA or date countdown */}
      {profileLoaded && !coupleProfile && (
        <Link href="/profile">
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-6 flex items-center gap-4 group hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <FiHeart className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                Complete your wedding profile
              </h3>
              <p className="text-xs text-gray-500">
                Set your wedding date, theme, and preferences to get personalized recommendations.
              </p>
            </div>
            <FiArrowRight className="w-5 h-5 text-rose-400 group-hover:text-rose-600 transition-colors shrink-0" />
          </div>
        </Link>
      )}

      {coupleProfile?.weddingDate && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Wedding Countdown
          </h2>
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <FiCalendar className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {daysUntilWedding != null && daysUntilWedding > 0
                  ? `${daysUntilWedding} day${daysUntilWedding === 1 ? "" : "s"} to go`
                  : daysUntilWedding === 0
                    ? "Today is the day!"
                    : "Wedding day has passed"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(coupleProfile.weddingDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {coupleProfile.weddingTheme && (
                  <span className="ml-2 text-rose-500 font-medium">· {coupleProfile.weddingTheme}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {coupleProfile && !coupleProfile.weddingDate && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Wedding Timeline
          </h2>
          <Link href="/profile">
            <div className="bg-white rounded-xl border border-gray-200/80 border-dashed p-12 text-center hover:border-rose-300 transition-colors cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Set your wedding date
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Add your wedding date to your profile to see a countdown and timeline.
              </p>
            </div>
          </Link>
        </div>
      )}

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
