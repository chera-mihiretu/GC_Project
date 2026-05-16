import type { IconType } from "react-icons";

interface StatCardProps {
  icon: IconType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: "rose" | "blue" | "green" | "amber" | "gray";
}

const colorMap: Record<string, { iconBg: string; iconText: string }> = {
  rose:  { iconBg: "bg-rose-50 border-rose-200/40",    iconText: "text-rose-500" },
  blue:  { iconBg: "bg-blue-50 border-blue-200/40",    iconText: "text-blue-500" },
  green: { iconBg: "bg-emerald-50 border-emerald-200/40", iconText: "text-emerald-500" },
  amber: { iconBg: "bg-amber-50 border-amber-200/40",  iconText: "text-amber-500" },
  gray:  { iconBg: "bg-warm-50 border-warm-200/30",    iconText: "text-slate-400" },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = "rose",
}: StatCardProps) {
  const c = colorMap[color] ?? colorMap.rose;
  return (
    <div className="rounded-2xl border border-warm-200/50 bg-white p-5 sm:p-6 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${c.iconBg}`}
      >
        <Icon className={`w-4.5 h-4.5 ${c.iconText}`} />
      </div>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          {value}
        </p>
        <p className="text-[12px] text-slate-400 font-light mt-1">{label}</p>
        {subtext && (
          <p className="text-[11px] text-amber-500 font-medium mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}
