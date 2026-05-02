import type { IconType } from "react-icons";

interface StatCardProps {
  icon: IconType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "rose" | "blue" | "green" | "amber" | "gray";
}

const colorMap = {
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  gray: "bg-gray-100 text-gray-600",
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "rose",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 flex items-start gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          {value}
        </p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
