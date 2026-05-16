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
  FiSend,
  FiAlertCircle,
  FiX,
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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="space-y-10">
        <div>
          <div className="h-3 w-16 bg-warm-100 rounded animate-pulse mb-3" />
          <div className="h-9 w-52 bg-warm-100 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-2xl border border-warm-200/30 bg-white p-10 animate-pulse">
          <div className="h-5 w-40 bg-warm-100 rounded mb-6" />
          <div className="h-12 bg-warm-100 rounded-xl" />
        </div>
        <div className="rounded-2xl border border-warm-200/30 bg-white p-10 animate-pulse">
          <div className="h-5 w-32 bg-warm-100 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-warm-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
          Organization
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
          Team
        </h1>
        <p className="text-[14px] text-slate-400 font-light mt-2">
          Manage your staff members and invitations
          {activeOrg && (
            <span className="ml-1.5 text-slate-600 font-medium">
              · {activeOrg.name}
            </span>
          )}
        </p>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-[13px] text-red-600">
          <FiAlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer text-red-300 hover:text-red-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-[13px] text-emerald-700">
          <FiCheckCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess("")} className="cursor-pointer text-emerald-300 hover:text-emerald-500 transition-colors duration-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Invite form ── */}
      <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
            <FiSend className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Invite Staff Member</h2>
            <p className="text-[11px] text-slate-400 font-light mt-0.5">
              Send an email invitation to join your team
            </p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="staff@example.com"
            className="flex-1 px-4 py-3.5 border border-warm-200/60 rounded-xl text-[14px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
            disabled={inviting}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "member")}
            className="px-4 py-3.5 border border-warm-200/60 rounded-xl text-[13px] text-slate-700 bg-white outline-none appearance-none transition-all duration-500 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
            disabled={inviting}
          >
            <option value="member">Staff (Limited)</option>
          </select>
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="cursor-pointer flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[13px] font-semibold shadow-[0_2px_12px_rgba(15,23,42,0.1)] hover:bg-slate-800 hover:shadow-[0_4px_20px_rgba(15,23,42,0.18)] transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {inviting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </span>
            ) : (
              <>
                <FiSend className="w-3.5 h-3.5" />
                Send Invite
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 font-light mt-5 leading-relaxed">
          Staff members can manage chat, bookings, and schedule. They cannot access financial data or edit the business profile.
        </p>
      </section>

      {/* ── Team Members ── */}
      <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center">
            <FiUsers className="w-4.5 h-4.5 text-slate-400" />
          </div>
          <h2 className="text-[15px] font-semibold text-slate-900">
            Team Members
          </h2>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-warm-100 text-slate-500 font-semibold">
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-5">
              <FiUsers className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-medium text-slate-500 mb-1">No team members yet</p>
            <p className="text-[13px] text-slate-400 font-light">
              Invite your first staff member above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isPending = pendingIds.has(member.id);
              const isOwner = member.role === "owner";
              return (
                <div
                  key={member.id}
                  className={`group flex items-center justify-between gap-4 px-5 py-4 rounded-xl transition-all duration-500 ${
                    isPending
                      ? "opacity-30 pointer-events-none scale-[0.98]"
                      : "bg-warm-50/30 border border-warm-200/20 hover:border-warm-200/50"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isOwner
                        ? "bg-gold-50 border-gold-200/40"
                        : "bg-white border-warm-200/40"
                    }`}>
                      {isOwner ? (
                        <FiShield className="w-4 h-4 text-gold-500" />
                      ) : (
                        <FiUser className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-slate-800 truncate">
                        {member.user?.name ?? "Unknown"}
                      </p>
                      <p className="text-[12px] text-slate-400 font-light truncate">
                        {member.user?.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-luxury px-2.5 py-1 rounded-lg border ${
                        isOwner
                          ? "bg-gold-50 text-gold-600 border-gold-200/40"
                          : "bg-warm-50 text-slate-500 border-warm-200/30"
                      }`}
                    >
                      {isOwner ? "Owner" : "Staff"}
                    </span>
                    {!isOwner && (
                      <button
                        onClick={() => setConfirmAction({ type: "remove", id: member.id, label: member.user?.name || member.user?.email || "this member" })}
                        className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-500"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Pending Invitations ── */}
      {invitations.length > 0 && (
        <section className="rounded-2xl border border-warm-200/50 bg-white p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center">
              <FiClock className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              Pending Invitations
            </h2>
            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 font-semibold border border-amber-200/40">
              {invitations.filter((i) => i.status === "pending").length}
            </span>
          </div>

          <div className="space-y-3">
            {invitations.map((inv) => {
              const isPending = pendingIds.has(inv.id);
              const isOptimistic = inv.id.startsWith("optimistic-");
              const isAccepted = inv.status === "accepted";
              return (
                <div
                  key={inv.id}
                  className={`group flex items-center justify-between gap-4 px-5 py-4 rounded-xl border transition-all duration-500 ${
                    isPending
                      ? "opacity-30 pointer-events-none scale-[0.98]"
                      : isOptimistic
                        ? "bg-amber-50/20 border-amber-200/20 animate-pulse"
                        : "bg-warm-50/30 border-warm-200/20 hover:border-warm-200/50"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isAccepted
                        ? "bg-emerald-50 border-emerald-200/40"
                        : "bg-amber-50 border-amber-200/40"
                    }`}>
                      {isAccepted ? (
                        <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <FiMail className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-slate-800 truncate">
                        {inv.email}
                      </p>
                      <p className="text-[12px] text-slate-400 font-light">
                        {isOptimistic
                          ? "Sending invitation..."
                          : inv.status === "pending"
                            ? `Expires ${new Date(inv.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                            : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-luxury px-2.5 py-1 rounded-lg border ${
                        inv.status === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200/40"
                          : isAccepted
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200/40"
                            : "bg-warm-50 text-slate-500 border-warm-200/30"
                      }`}
                    >
                      {isOptimistic ? "Sending..." : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                    {inv.status === "pending" && !isOptimistic && (
                      <button
                        onClick={() => setConfirmAction({ type: "cancel", id: inv.id, label: inv.email })}
                        className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all duration-500"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Confirm modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 sm:p-10 max-w-sm w-full mx-4 shadow-[0_20px_60px_rgba(15,23,42,0.15)] animate-scale-reveal">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
              <FiTrash2 className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-900 text-center mb-2">
              {confirmAction.type === "remove" ? "Remove member" : "Cancel invitation"}
            </h3>
            <p className="text-[13px] text-slate-400 font-light text-center leading-relaxed mb-8">
              {confirmAction.type === "remove"
                ? <>Are you sure you want to remove <strong className="text-slate-700 font-medium">{confirmAction.label}</strong> from the team?</>
                : <>Cancel the invitation to <strong className="text-slate-700 font-medium">{confirmAction.label}</strong>?</>}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500"
              >
                Keep
              </button>
              <button
                onClick={handleConfirmedAction}
                className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-[0_2px_12px_rgba(220,38,38,0.15)] hover:shadow-[0_4px_20px_rgba(220,38,38,0.25)] transition-all duration-500"
              >
                {confirmAction.type === "remove" ? "Remove" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
