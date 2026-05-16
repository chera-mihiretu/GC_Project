"use client";

import { useSession } from "@/lib/auth-client";
import DeleteAccountSection from "@/components/account/delete-account-section";
import { FiUser, FiMail, FiShield } from "react-icons/fi";

export default function VendorSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Account
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Settings
        </h1>
      </div>

      {/* Account information */}
      <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
            <FiShield className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Account Information</h2>
            <p className="text-[12px] text-slate-400 font-light mt-0.5">Your personal details</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl bg-warm-50/50 border border-warm-200/30 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0">
              <FiUser className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-editorial text-slate-400 mb-0.5">
                Full Name
              </p>
              <p className="text-[14px] font-medium text-slate-800 truncate">
                {user?.name ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-warm-50/50 border border-warm-200/30 px-5 py-4">
            <div className="w-9 h-9 rounded-lg bg-white border border-warm-200/40 flex items-center justify-center shrink-0">
              <FiMail className="w-4 h-4 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-editorial text-slate-400 mb-0.5">
                Email Address
              </p>
              <p className="text-[14px] font-medium text-slate-800 truncate">
                {user?.email ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-red-200/40 to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-editorial text-red-400">
            Danger Zone
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-red-200/40 to-transparent" />
        </div>
        <DeleteAccountSection />
      </section>
    </div>
  );
}
