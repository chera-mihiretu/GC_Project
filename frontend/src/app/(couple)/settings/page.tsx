"use client";

import { useSession } from "@/lib/auth-client";
import DeleteAccountSection from "@/components/account/delete-account-section";
import { FiUser, FiMail, FiShield, FiSettings, FiClock } from "react-icons/fi";

export default function CoupleSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">Account</p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">Settings</h1>
        <p className="text-[13px] text-slate-400 font-light mt-2">Manage your account information and preferences</p>
      </div>

      {/* ── Account Info ── */}
      <div className="rounded-2xl border border-warm-200/50 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-warm-50 border border-warm-200/30 flex items-center justify-center">
            <FiSettings className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Account Information</h2>
            <p className="text-[11px] text-slate-400 font-light">Your personal details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-warm-200/30 flex items-center justify-center">
                <FiUser className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] uppercase tracking-luxury font-medium text-slate-400">Full Name</p>
            </div>
            <p className="text-[14px] font-semibold text-slate-800 pl-9">{user?.name ?? "—"}</p>
          </div>

          {/* Email */}
          <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-warm-200/30 flex items-center justify-center">
                <FiMail className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] uppercase tracking-luxury font-medium text-slate-400">Email Address</p>
            </div>
            <p className="text-[14px] font-semibold text-slate-800 pl-9">{user?.email ?? "—"}</p>
          </div>

          {/* Role */}
          <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-warm-200/30 flex items-center justify-center">
                <FiShield className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] uppercase tracking-luxury font-medium text-slate-400">Account Type</p>
            </div>
            <p className="text-[14px] font-semibold text-slate-800 pl-9 capitalize">{user?.role ?? "—"}</p>
          </div>

          {/* Member Since */}
          <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white border border-warm-200/30 flex items-center justify-center">
                <FiClock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] uppercase tracking-luxury font-medium text-slate-400">Member Since</p>
            </div>
            <p className="text-[14px] font-semibold text-slate-800 pl-9">{memberSince ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-red-200/30" />
          <p className="text-[10px] uppercase tracking-luxury font-semibold text-red-400">Danger Zone</p>
          <div className="h-px flex-1 bg-red-200/30" />
        </div>
        <DeleteAccountSection />
      </div>
    </div>
  );
}
