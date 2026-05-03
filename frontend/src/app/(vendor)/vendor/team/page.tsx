"use client";

import { useEffect, useState, useCallback } from "react";
import { organization } from "@/lib/auth-client";
import {
  FiUsers,
  FiMail,
  FiTrash2,
  FiShield,
  FiUser,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

interface OrgMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date | string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
  organizationId: string;
}

export default function VendorTeamPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member">("member");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeOrg, setActiveOrg] = useState<{ id: string; name: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "remove" | "cancel"; id: string; label: string } | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const fetchTeamData = useCallback(async () => {
    try {
      const orgsResult = await organization.list();
      const orgs = orgsResult?.data;
      if (!orgs || orgs.length === 0) {
        setError("No organization found. Complete your vendor profile first.");
        setLoading(false);
        return;
      }

      const vendorOrg = orgs[0];
      await organization.setActive({ organizationId: vendorOrg.id });

      const orgData = await organization.getFullOrganization();
      if (orgData?.data) {
        setActiveOrg({ id: orgData.data.id, name: orgData.data.name });
        setMembers(orgData.data.members ?? []);
        setInvitations(orgData.data.invitations ?? []);
      }
    } catch {
      setError("Failed to load team data. Make sure your vendor profile is set up.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }

    if (!activeOrg) {
      setError("No organization found. Complete your vendor profile first.");
      return;
    }

    setInviting(true);
    const emailToInvite = inviteEmail.trim();
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const eligibility = await fetch(`${apiBase}/api/v1/auth/check-invite-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: emailToInvite }),
      });
      const eligibilityData = await eligibility.json();
      if (!eligibilityData.eligible) {
        setError(eligibilityData.reason || "This email cannot be invited.");
        setInviting(false);
        return;
      }

      const optimisticInv: OrgInvitation = {
        id: `optimistic-${Date.now()}`,
        email: emailToInvite,
        role: inviteRole,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        organizationId: activeOrg.id,
      };
      setInvitations((prev) => [...prev, optimisticInv]);
      setSuccess(`Invitation sent to ${emailToInvite}`);
      setInviteEmail("");

      await organization.inviteMember({
        email: emailToInvite,
        role: inviteRole,
        organizationId: activeOrg.id,
      });
      fetchTeamData();
    } catch (err: unknown) {
      setInvitations((prev) => prev.filter((i) => !i.id.startsWith("optimistic-")));
      setSuccess("");
      const message = err instanceof Error ? err.message : "Failed to send invitation";
      setError(message);
    } finally {
      setInviting(false);
    }
  }

  async function handleConfirmedAction() {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    setConfirmAction(null);

    setPendingIds((prev) => new Set(prev).add(id));

    const prevMembers = members;
    const prevInvitations = invitations;

    if (type === "remove") {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } else {
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    }

    try {
      if (type === "remove") {
        await organization.removeMember({ memberIdOrEmail: id });
      } else {
        await organization.cancelInvitation({ invitationId: id });
      }
      fetchTeamData();
    } catch {
      if (type === "remove") {
        setMembers(prevMembers);
      } else {
        setInvitations(prevInvitations);
      }
      setError(type === "remove" ? "Failed to remove member" : "Failed to cancel invitation");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-pulse text-sm">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display">
          Team Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your staff members and send invitations.
          {activeOrg && (
            <span className="ml-1 text-blue-600 font-medium">
              {activeOrg.name}
            </span>
          )}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Invite Form */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiMail className="w-5 h-5 text-blue-600" />
          Invite Staff Member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none"
            disabled={inviting}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "member")}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none bg-white"
            disabled={inviting}
          >
            <option value="member">Staff (Limited Access)</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="cursor-pointer px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">
          Staff members can manage chat, bookings, and schedule. They cannot access financial data or edit the business profile.
        </p>
      </div>

      {/* Current Members */}
      <div className="bg-white rounded-xl border border-gray-200/80 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiUsers className="w-5 h-5 text-blue-600" />
          Team Members
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full ml-1">
            {members.length}
          </span>
        </h2>

        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No team members yet. Invite your first staff member above.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((member) => {
              const isPending = pendingIds.has(member.id);
              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between py-4 first:pt-0 last:pb-0 transition-opacity duration-300 ${isPending ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      {member.role === "owner" ? (
                        <FiShield className="w-4 h-4 text-blue-600" />
                      ) : (
                        <FiUser className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {member.user?.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        member.role === "owner"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {member.role === "owner" ? "Owner" : "Staff"}
                    </span>
                    {member.role !== "owner" && (
                      <button
                        onClick={() => setConfirmAction({ type: "remove", id: member.id, label: member.user?.name || member.user?.email || "this member" })}
                        className="cursor-pointer p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        title="Remove member"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200/80 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-amber-500" />
            Pending Invitations
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full ml-1">
              {invitations.filter((i) => i.status === "pending").length}
            </span>
          </h2>
          <div className="divide-y divide-gray-100">
            {invitations.map((inv) => {
              const isPending = pendingIds.has(inv.id);
              const isOptimistic = inv.id.startsWith("optimistic-");
              return (
                <div
                  key={inv.id}
                  className={`flex items-center justify-between py-4 first:pt-0 last:pb-0 transition-opacity duration-300 ${isPending ? "opacity-40 pointer-events-none" : ""} ${isOptimistic ? "animate-pulse" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      {inv.status === "accepted" ? (
                        <FiCheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <FiMail className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isOptimistic
                          ? "Sending invitation..."
                          : inv.status === "pending"
                            ? `Expires ${new Date(inv.expiresAt).toLocaleDateString()}`
                            : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        inv.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : inv.status === "accepted"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isOptimistic ? "Sending..." : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                    {inv.status === "pending" && !isOptimistic && (
                      <button
                        onClick={() => setConfirmAction({ type: "cancel", id: inv.id, label: inv.email })}
                        className="cursor-pointer p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        title="Cancel invitation"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmAction.type === "remove" ? "Remove member" : "Cancel invitation"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmAction.type === "remove"
                ? <>Are you sure you want to remove <strong>{confirmAction.label}</strong> from the team?</>
                : <>Cancel the invitation to <strong>{confirmAction.label}</strong>?</>}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleConfirmedAction}
                className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                {confirmAction.type === "remove" ? "Remove" : "Cancel invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
