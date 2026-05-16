"use client";

import { useRouter } from "next/navigation";
import { useSocketContext } from "./socket-provider";
import { FiCheck, FiCheckCircle, FiLoader, FiBell } from "react-icons/fi";
import type { Notification } from "@/types/realtime";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationHref(n: Notification): string | null {
  const meta = n.metadata ?? {};
  switch (n.type) {
    case "vendor_submitted":
      return meta.vendorProfileId
        ? `/admin/vendors/${meta.vendorProfileId}`
        : "/admin/vendors";
    case "vendor_approved":
      return "/vendor/dashboard";
    case "vendor_rejected":
      return "/vendor/profile/setup";
    case "booking_request":
      return meta.bookingId
        ? `/vendor/bookings/${meta.bookingId}`
        : "/vendor/bookings";
    case "booking_status_update":
      if (meta.recipientRole === "vendor") {
        return meta.bookingId
          ? `/vendor/bookings/${meta.bookingId}`
          : "/vendor/bookings";
      }
      return meta.bookingId
        ? `/bookings/${meta.bookingId}`
        : "/bookings";
    case "budget_alert":
      return "/budget";
    default:
      return null;
  }
}

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    hasMoreNotifications,
    loadingMoreNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    fetchMoreNotifications,
  } = useSocketContext();

  function handleClick(n: Notification) {
    if (!n.read) {
      markNotificationRead(n.id);
    }
    const href = getNotificationHref(n);
    if (href) {
      router.push(href);
    }
    onClose();
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.1)] border border-warm-200/50 z-50 overflow-hidden animate-scale-reveal origin-top-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-warm-200/30">
        <h3 className="text-[14px] font-semibold text-slate-800">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="cursor-pointer flex items-center gap-1.5 text-[11px] text-rose-500 hover:text-rose-600 font-medium transition-colors duration-300"
          >
            <FiCheckCircle className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200/40 flex items-center justify-center mx-auto mb-3">
              <FiBell className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-[13px] text-slate-400 font-light">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map((n) => {
              const href = getNotificationHref(n);
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleClick(n);
                  }}
                  className={`group flex items-start gap-3 px-5 py-3.5 border-b border-warm-200/20 last:border-b-0 transition-all duration-300 ${
                    href ? "cursor-pointer" : "cursor-default"
                  } ${
                    n.read
                      ? "bg-white hover:bg-warm-50/40"
                      : "bg-rose-50/20 hover:bg-rose-50/40"
                  }`}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                  )}

                  <div className={`flex-1 min-w-0 ${n.read ? "ml-[14px]" : ""}`}>
                    <p
                      className={`text-[13px] leading-snug ${
                        n.read
                          ? "text-slate-500"
                          : "text-slate-800 font-medium"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-[12px] text-slate-400 font-light mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-300 mt-1.5">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(n.id);
                      }}
                      className="cursor-pointer shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-warm-100 hover:text-slate-500 transition-all duration-300"
                      title="Mark as read"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {hasMoreNotifications && (
              <div className="p-3 flex justify-center border-t border-warm-200/20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchMoreNotifications();
                  }}
                  disabled={loadingMoreNotifications}
                  className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium text-slate-400 bg-warm-50 rounded-xl border border-warm-200/30 hover:bg-warm-100 disabled:opacity-40 transition-all duration-300"
                >
                  {loadingMoreNotifications ? <FiLoader className="w-3 h-3 animate-spin" /> : null}
                  {loadingMoreNotifications ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
