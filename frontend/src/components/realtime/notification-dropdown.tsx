"use client";

import { useRouter } from "next/navigation";
import { useSocketContext } from "./socket-provider";
import { FiCheck, FiCheckCircle, FiLoader } from "react-icons/fi";
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
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200/80 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead()}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
          >
            <FiCheckCircle className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No notifications yet
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
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
                    href ? "cursor-pointer" : "cursor-default"
                  } ${
                    n.read
                      ? "bg-white hover:bg-gray-50/80"
                      : "bg-rose-50/40 hover:bg-rose-50/70"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        n.read
                          ? "text-gray-600"
                          : "text-gray-900 font-medium"
                      }`}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-300 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  {!n.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(n.id);
                      }}
                      className="shrink-0 p-1 text-gray-300 hover:text-rose-500 transition-colors"
                      title="Mark as read"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
            {hasMoreNotifications && (
              <div className="p-3 flex justify-center border-t border-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchMoreNotifications();
                  }}
                  disabled={loadingMoreNotifications}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer"
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
