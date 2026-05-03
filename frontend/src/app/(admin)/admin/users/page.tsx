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
  FiMoreVertical,
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

const ROLE_STYLES: Record<string, { bg: string; text: string; icon: typeof FiUser }> = {
  couple: { bg: "bg-rose-50", text: "text-rose-600", icon: FiUser },
  vendor: { bg: "bg-blue-50", text: "text-blue-600", icon: FiShoppingBag },
  admin: { bg: "bg-amber-50", text: "text-amber-600", icon: FiShield },
};

const PAGE_SIZE = 20;

type ModalAction = "ban" | "unban" | "impersonate" | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
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
        setUsers((prev) => append ? [...prev, ...fetched] : fetched);
        setTotal((res.data.total as number) ?? 0);
      }
    } catch {
      if (!append) { setUsers([]); setTotal(0); }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers(0, false);
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  function handleRoleChange(role: RoleFilter) {
    setRoleFilter(role);
  }

  function handleLoadMore() {
    fetchUsers(users.length, true);
  }

  function openModal(user: AdminUser, action: ModalAction) {
    setSelectedUser(user);
    setModalAction(action);
    setActionError("");
    setBanReason("");
    setBanDuration("permanent");
    setCustomDays("");
    setOpenMenuId(null);
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
        body: JSON.stringify({
          userId: selectedUser.id,
          action: "unban",
        }),
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

  const hasMore = users.length < total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center gap-2">
          <FiUsers className="w-7 h-7 text-amber-500" />
          Users
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {total} registered user{total !== 1 ? "s" : ""} on the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleChange(role)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                roleFilter === role
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {role === "all" ? "All" : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left font-medium text-gray-500 px-5 py-3">User</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Role</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden sm:table-cell">Email Verified</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3 hidden md:table-cell">Joined</th>
                <th className="text-left font-medium text-gray-500 px-5 py-3">Status</th>
                <th className="text-right font-medium text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4 hidden sm:table-cell"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleStyle = ROLE_STYLES[user.role ?? "couple"] ?? ROLE_STYLES.couple;
                  const RoleIcon = roleStyle.icon;
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                            {user.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (user.name ?? "?").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name || "Unnamed"}
                            </p>
                            <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                              <FiMail className="w-3 h-3 shrink-0" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleStyle.bg} ${roleStyle.text}`}>
                          <RoleIcon className="w-3 h-3" />
                          {user.role ?? "couple"}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {user.emailVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <FiCheckCircle className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <FiXCircle className="w-3.5 h-3.5" /> Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {user.banned ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                              <FiSlash className="w-3 h-3" /> Banned
                            </span>
                            {user.banReason && (
                              <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[120px]" title={user.banReason}>
                                {user.banReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === user.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                                {user.banned ? (
                                  <button
                                    onClick={() => openModal(user, "unban")}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors cursor-pointer text-left"
                                  >
                                    <FiRefreshCw className="w-3.5 h-3.5" />
                                    Reactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openModal(user, "ban")}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                                  >
                                    <FiSlash className="w-3.5 h-3.5" />
                                    Suspend / Ban
                                  </button>
                                )}
                                {user.role !== "admin" && (
                                  <button
                                    onClick={() => openModal(user, "impersonate")}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                  >
                                    <FiLogIn className="w-3.5 h-3.5" />
                                    Impersonate
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Load more */}
        {!loading && hasMore && (
          <div className="flex justify-center py-4 border-t border-gray-100">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loadingMore ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
              {loadingMore ? "Loading..." : `Load more (${users.length} of ${total})`}
            </button>
          </div>
        )}

        {!loading && users.length > 0 && !hasMore && (
          <div className="text-center py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">All {total} users loaded</p>
          </div>
        )}
      </div>

      {/* Ban confirmation modal */}
      {modalAction === "ban" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <FiSlash className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Suspend / Ban User</h3>
                <p className="text-xs text-gray-500">{selectedUser.name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This will immediately sign the user out and prevent them from logging in.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Violating terms of service"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ["permanent", "Permanent"],
                    ["7d", "7 Days"],
                    ["30d", "30 Days"],
                    ["custom", "Custom"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setBanDuration(value)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        banDuration === value
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
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
                    className="w-full mt-2 px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white outline-none placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                )}
              </div>
            </div>

            {actionError && (
              <p className="text-xs text-red-500 mb-3">{actionError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban / Reactivate confirmation modal */}
      {modalAction === "unban" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <FiRefreshCw className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Reactivate User</h3>
                <p className="text-xs text-gray-500">{selectedUser.name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-5">
              This will remove the ban and allow the user to sign in again. Are you sure?
            </p>

            {selectedUser.banReason && (
              <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 mb-4">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Ban reason:</span> {selectedUser.banReason}
                </p>
              </div>
            )}

            {actionError && (
              <p className="text-xs text-red-500 mb-3">{actionError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnban}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Reactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate confirmation modal */}
      {modalAction === "impersonate" && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <FiLogIn className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Impersonate User</h3>
                <p className="text-xs text-gray-500">{selectedUser.name} ({selectedUser.email})</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              You will view the platform as this user. This action is logged for security auditing.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
              The impersonation session expires after 1 hour. You can exit at any time using the banner at the top.
            </p>

            {actionError && (
              <p className="text-xs text-red-500 mb-3">{actionError}</p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImpersonate}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-60"
              >
                {actionLoading && <FiLoader className="w-3.5 h-3.5 animate-spin" />}
                Start Impersonation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
