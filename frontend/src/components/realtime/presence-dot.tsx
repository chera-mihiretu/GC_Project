"use client";

interface PresenceDotProps {
  online: boolean;
  className?: string;
}

export default function PresenceDot({
  online,
  className = "",
}: PresenceDotProps) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white ${
        online ? "bg-emerald-400" : "bg-gray-300"
      } ${className}`}
      title={online ? "Online" : "Offline"}
    />
  );
}
