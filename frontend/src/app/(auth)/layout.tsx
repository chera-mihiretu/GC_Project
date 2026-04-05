import { FiHeart } from "react-icons/fi";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Hero panel — hidden on mobile */}
      <div className="hidden lg:flex relative flex-1 bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 overflow-hidden">
        {/* Decorative overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,255,255,0.08)_0%,transparent_50%)]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-16 text-white">
          <h1 className="font-display text-[44px] xl:text-[52px] font-bold leading-[1.15] mb-5 tracking-tight">
            Your perfect day,
            <br />
            perfectly planned.
          </h1>
          <p className="text-lg leading-relaxed opacity-90 max-w-[420px]">
            From venue to vows, Twedarr brings every detail together so you can
            focus on what matters most — celebrating your love.
          </p>
        </div>

        {/* Decorative rings */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 border-2 border-white/12 rounded-full" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 border border-white/8 rounded-full" />
        <div className="absolute top-20 right-20 w-2 h-2 bg-white/30 rounded-full" />
      </div>

      {/* Form panel */}
      <div className="flex-1 lg:flex-none lg:w-[520px] xl:w-[580px] flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-[420px]">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-rose-600 rounded-[10px] flex items-center justify-center text-white">
              <FiHeart className="w-4 h-4" />
            </div>
            <span className="font-display text-[22px] font-bold text-slate-900 tracking-tight">
              Twedarr
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
