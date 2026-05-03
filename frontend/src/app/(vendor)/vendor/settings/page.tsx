"use client";

import { useSession } from "@/lib/auth-client";
import DeleteAccountSection from "@/components/account/delete-account-section";
import { FiUser, FiMail } from "react-icons/fi";

export default function VendorSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <FiUser className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Name:</span>
            <span className="text-gray-900 font-medium">{session?.user?.name ?? "—"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FiMail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-900 font-medium">{session?.user?.email ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">Danger Zone</h2>
        <DeleteAccountSection />
      </div>
    </div>
  );
}
