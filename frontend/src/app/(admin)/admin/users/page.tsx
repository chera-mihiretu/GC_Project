"use client";

import { useEffect, useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/services/auth.service";
import {
  FiUsers,
  FiSearch,
  FiShield,
  FiUser,
  FiShoppingBag,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiSlash,
  FiRefreshCw,
  FiLogIn,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role?: string;
  image?: string | null;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  createdAt: string;
}

const ROLES = ["all", "couple", "vendor", "admin"] as const;
type RoleFilter = (typeof ROLES)[number];

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; icon: typeof FiUser; label: string }> = {
  couple: { bg: "bg-rose-50", text: "text-rose-500", border: "border-rose-200/40", icon: FiUser, label: "Couple" },
  vendor: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-200/40", icon: FiShoppingBag, label: "Vendor" },
  admin:  { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-200/40", icon: FiShield, label: "Admin" },
};

const PAGE_SIZE = 10;

type ModalAction = "ban" | "unban" | "impersonate" | null;

const INPUT_CLS =
  "w-full px-4 py-3 border border-warm-200/60 rounded-xl text-[13px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<"permanent" | "7d" | "30d" | "custom">("permanent");
  const [customDays, setCustomDays] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const query: Record<string, unknown> = {
        limit: PAGE_SIZE,
        offset,
        sortBy: "createdAt",
        sortDirection: "desc",
      };

      if (search) {
        query.searchValue = search;
        query.searchField = "email";
        query.searchOperator = "contains";
      }

      if (roleFilter !== "all") {
        query.filterField = "role";
        query.filterValue = roleFilter;
        query.filterOperator = "eq";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await authClient.admin.listUsers({ query } as any);

      if (res.data) {
        const fetched = ((res.data.users ?? []) as unknown) as AdminUser[];
        setUsers(fetched);
        setTotal((res.data.total as number) ?? 0);
      }
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  function handleRoleChange(role: RoleFilter) {
    setRoleFilter(role);
    setPage(1);
  }

  function openModal(user: AdminUser, action: ModalAction) {
    setSelectedUser(user);
    setModalAction(action);
    setActionError("");
    setBanReason("");
    setBanDuration("permanent");
    setCustomDays("");
  }

  function closeModal() {
    setSelectedUser(null);
    setModalAction(null);
    setActionError("");
  }

  async function handleBan() {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError("");

    try {
      let banExpiresIn: number | undefined;
      if (banDuration === "7d") banExpiresIn = 7 * 24 * 60 * 60;
      else if (banDuration === "30d") banExpiresIn = 30 * 24 * 60 * 60;
      else if (banDuration === "custom" && customDays) banExpiresIn = parseInt(customDays) * 24 * 60 * 60;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = { userId: selectedUser.id };
      if (banReason) params.banReason = banReason;
      if (banExpiresIn) params.banExpiresIn = banExpiresIn;

      const res = await authClient.admin.banUser(params);
      if (res.error) throw new Error(res.error.message ?? "Failed to ban user");

      let durationLabel = "permanent";
      if (banDuration === "7d") durationLabel = "7 days";
      else if (banDuration === "30d") durationLabel = "30 days";
      else if (banDuration === "custom" && customDays) durationLabel = `${customDays} days`;

      apiFetch("/api/v1/admin/notify-user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "ban",
          reason: banReason || undefined,
          duration: durationLabel,
        }),
      }).catch(() => {});

      setUsers((prev) =>
        prev.map((u) => u.id === selectedUser.id ? { ...u, banned: true, banReason: banReason || null } : u),
      );
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to ban user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnban() {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError("");

    try {
      const res = await authClient.admin.unbanUser({ userId: selectedUser.id });
      if (res.error) throw new Error(res.error.message ?? "Failed to reactivate user");

      apiFetch("/api/v1/admin/notify-user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, action: "unban" }),
      }).catch(() => {});

      setUsers((prev) =>
        prev.map((u) => u.id === selectedUser.id ? { ...u, banned: false, banReason: null } : u),
      );
      closeModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reactivate user");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleImpersonate() {
    if (!selectedUser) return;
    setActionLoading(true);
    setActionError("");

    try {
      const res = await authClient.admin.impersonateUser({ userId: selectedUser.id });
      if (res.error) throw new Error(res.error.message ?? "Failed to impersonate user");

      localStorage.setItem("twedar_impersonating", JSON.stringify({
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        userId: selectedUser.id,
      }));
      window.location.href = "/";
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to impersonate user");
      setActionLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-2">
            Administration
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-headline">
            User Management
          </h1>
          <p className="text-[14px] text-slate-400 font-light mt-2">
            {loading ? "Loading..." : `${total} registered user${total !== 1 ? "s" : ""} on the platform`}
          </p>
        </div>

        {/* Role filter */}
        <div className="rounded-xl bg-warm-50/60 border border-warm-200/30 p-1 flex gap-0.5 w-fit self-start sm:self-auto">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`cursor-pointer px-3.5 py-2 rounded-lg text-[12px] font-medium capitalize whitespace-nowrap transition-all duration-500 ${
                roleFilter === role
                  ? "bg-white text-slate-900 shadow-[0_1px_4px_rgba(15,23,42,0.06)]"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {role === "all" ? "All" : role}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
        <div className="relative flex-1">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email..."
            className="w-full pl-11 pr-10 py-3 border border-warm-200/60 rounded-xl text-[13px] text-slate-800 bg-white outline-none transition-all duration-500 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_3px_rgba(250,248,245,1),0_0_0_5px_rgba(201,168,76,0.15)]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-slate-300 hover:text-slate-500 transition-colors duration-300"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="cursor-pointer px-5 py-3 bg-slate-900 text-white text-[12px] font-semibold rounded-xl hover:bg-slate-800 shadow-[0_2px_12px_rgba(15,23,42,0.1)] transition-all duration-500"
        >
          Search
        </button>
      </form>

      {/* ── User cards ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-warm-200/30 bg-white p-5 sm:p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-warm-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-warm-100 rounded" />
                  <div className="h-3 w-48 bg-warm-100 rounded" />
                </div>
                <div className="h-6 w-16 bg-warm-100 rounded-lg shrink-0" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-warm-200/50 bg-white py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-6">
            <FiUsers className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-display text-lg font-semibold text-slate-500 mb-2">No users found</p>
          <p className="text-[13px] text-slate-400 font-light max-w-xs mx-auto">
            {search ? "Try a different search term or adjust filters" : "Users will appear here once they register"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const roleStyle = ROLE_STYLES[user.role ?? "couple"] ?? ROLE_STYLES.couple;
            const RoleIcon = roleStyle.icon;
            return (
              <div
                key={user.id}
                className="group rounded-2xl border border-warm-200/40 bg-white hover:border-warm-200/70 hover:shadow-[0_2px_16px_rgba(15,23,42,0.03)] transition-all duration-500"
              >
                <div className="p-5 sm:p-6">
                  {/* Top: avatar + info + status */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center text-slate-400 text-[13px] font-bold shrink-0 overflow-hidden">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (user.name ?? "?").charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <p className="text-[14px] font-medium text-slate-800">{user.name || "Unnamed"}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-luxury border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                          <RoleIcon className="w-3 h-3" /> {roleStyle.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-400 font-light mt-0.5 flex items-center gap-1.5 truncate">
                        <FiMail className="w-3 h-3 shrink-0" /> {user.email}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {user.banned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury bg-red-50 text-red-500 border border-red-200/40">
                          <FiSlash className="w-3 h-3" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-luxury bg-emerald-50 text-emerald-500 border border-emerald-200/40">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ban reason if present */}
                  {user.banned && user.banReason && (
                    <div className="mt-3 ml-15 rounded-xl bg-red-50/40 border border-red-200/20 px-3.5 py-2">
                      <p className="text-[11px] text-red-400 font-light">
                        <span className="font-medium text-red-500">Reason:</span> {user.banReason}
                      </p>
                    </div>
                  )}

                  {/* Bottom: meta + actions */}
                  <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-warm-200/20">
                    {/* Meta chips */}
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 font-light">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {user.emailVerified ? (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <FiCheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-300">
                          <FiXCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {user.banned ? (
                        <button
                          onClick={() => openModal(user, "unban")}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50/50 border border-emerald-200/40 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-500"
                        >
                          <FiRefreshCw className="w-3 h-3" /> Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(user, "ban")}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-red-500 bg-red-50/50 border border-red-200/40 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all duration-500"
                        >
                          <FiSlash className="w-3 h-3" /> Ban
                        </button>
                      )}
                      {user.role !== "admin" && (
                        <button
                          onClick={() => openModal(user, "impersonate")}
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-slate-500 border border-warm-200/50 rounded-xl hover:bg-warm-50 hover:border-warm-200 transition-all duration-500"
                        >
                          <FiLogIn className="w-3 h-3" /> Impersonate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-warm-200/30 bg-white px-6 sm:px-8 py-4">
          <span className="text-[13px] text-slate-400 font-light">
            Page <span className="text-slate-600 font-medium">{page}</span> of{" "}
            <span className="text-slate-600 font-medium">{totalPages}</span>
            <span className="hidden sm:inline ml-1.5">· {total} total</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              <FiChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-slate-600 border border-warm-200/60 hover:border-warm-200 hover:bg-warm-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-500"
            >
              Next <FiChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Ban modal ── */}
      {modalAction === "ban" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] max-w-md w-full mx-4 p-8 sm:p-10 animate-scale-reveal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200/40 flex items-center justify-center">
                  <FiSlash className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">Suspend / Ban User</h3>
                  <p className="text-[11px] text-slate-400 font-light">{selectedUser.name} ({selectedUser.email})</p>
                </div>
              </div>
              <button onClick={closeModal} className="cursor-pointer w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-warm-50 transition-all duration-300">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-slate-400 font-light leading-relaxed mb-5">
              This will immediately sign the user out and prevent them from logging in.
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Reason (optional)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Violating terms of service"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {([["permanent", "Permanent"], ["7d", "7 Days"], ["30d", "30 Days"], ["custom", "Custom"]] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setBanDuration(value)}
                      className={`cursor-pointer px-3 py-2.5 text-[12px] font-medium rounded-xl border transition-all duration-500 ${
                        banDuration === value
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border-warm-200/60 text-slate-500 hover:bg-warm-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {banDuration === "custom" && (
                  <input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    placeholder="Number of days"
                    className={`${INPUT_CLS} mt-2`}
                  />
                )}
              </div>
            </div>

            {actionError && <p className="text-[12px] text-red-500 font-light mb-3">{actionError}</p>}

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 disabled:opacity-40 transition-all duration-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white bg-red-500 rounded-xl shadow-[0_2px_12px_rgba(239,68,68,0.15)] hover:bg-red-600 disabled:opacity-40 transition-all duration-500"
              >
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Unban modal ── */}
      {modalAction === "unban" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] max-w-sm w-full mx-4 p-8 sm:p-10 animate-scale-reveal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/40 flex items-center justify-center">
                <FiRefreshCw className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">Reactivate User</h3>
                <p className="text-[11px] text-slate-400 font-light">{selectedUser.name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-[13px] text-slate-400 font-light leading-relaxed mb-5">
              This will remove the ban and allow the user to sign in again.
            </p>

            {selectedUser.banReason && (
              <div className="rounded-xl bg-warm-50/60 border border-warm-200/20 px-4 py-3 mb-5">
                <p className="text-[12px] text-slate-500 font-light">
                  <span className="font-medium">Ban reason:</span> {selectedUser.banReason}
                </p>
              </div>
            )}

            {actionError && <p className="text-[12px] text-red-500 font-light mb-3">{actionError}</p>}

            <div className="flex gap-3">
              <button onClick={closeModal} disabled={actionLoading} className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 disabled:opacity-40 transition-all duration-500">
                Cancel
              </button>
              <button onClick={handleUnban} disabled={actionLoading} className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white bg-emerald-500 rounded-xl shadow-[0_2px_12px_rgba(5,150,105,0.15)] hover:bg-emerald-600 disabled:opacity-40 transition-all duration-500">
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Impersonate modal ── */}
      {modalAction === "impersonate" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.15)] max-w-sm w-full mx-4 p-8 sm:p-10 animate-scale-reveal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/40 flex items-center justify-center">
                <FiLogIn className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">Impersonate User</h3>
                <p className="text-[11px] text-slate-400 font-light">{selectedUser.name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-[13px] text-slate-400 font-light leading-relaxed mb-3">
              You will view the platform as this user. This action is logged for security auditing.
            </p>
            <div className="rounded-xl bg-amber-50/60 border border-amber-200/20 px-4 py-3 mb-6">
              <p className="text-[11px] text-amber-600 font-light leading-relaxed">
                The impersonation session expires after 1 hour. You can exit at any time using the banner.
              </p>
            </div>

            {actionError && <p className="text-[12px] text-red-500 font-light mb-3">{actionError}</p>}

            <div className="flex gap-3">
              <button onClick={closeModal} disabled={actionLoading} className="cursor-pointer flex-1 py-3 text-[13px] font-semibold text-slate-600 border border-warm-200/60 rounded-xl hover:bg-warm-50 disabled:opacity-40 transition-all duration-500">
                Cancel
              </button>
              <button onClick={handleImpersonate} disabled={actionLoading} className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-[13px] font-semibold text-white bg-amber-500 rounded-xl shadow-[0_2px_12px_rgba(217,119,6,0.15)] hover:bg-amber-600 disabled:opacity-40 transition-all duration-500">
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Start Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
