"use client";

import { useSocketContext } from "./socket-provider";
import { FiCheck, FiCheckCircle } from "react-icons/fi";

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

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useSocketContext();

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
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
                n.read ? "bg-white" : "bg-rose-50/40"
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
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {n.body}
                  </p>
                )}
                <p className="text-[11px] text-gray-300 mt-1">
                  {timeAgo(n.createdAt)}
                </p>
              </div>

              {!n.read && (
                <button
                  onClick={() => markNotificationRead(n.id)}
                  className="shrink-0 p-1 text-gray-300 hover:text-rose-500 transition-colors"
                  title="Mark as read"
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
