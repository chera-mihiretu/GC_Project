"use client";

import { useState, useRef, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useSocketContext } from "./socket-provider";
import NotificationDropdown from "./notification-dropdown";

export default function NotificationBell() {
  const { unreadCount } = useSocketContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-warm-100 transition-all duration-300"
        aria-label="Notifications"
      >
        <FiBell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full leading-none ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
