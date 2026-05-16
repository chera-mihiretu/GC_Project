import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ━━━ Left — Cinematic Brand Panel ━━━ */}
      <div className="hidden lg:flex relative flex-1 gradient-editorial-dark overflow-hidden">
        {/* Atmospheric light layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,rgba(201,168,76,0.07),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_70%_80%,rgba(251,113,133,0.04),transparent_50%)]" />

        {/* Decorative geometric accents */}
        <div className="absolute top-[12%] left-[8%] w-px h-32 bg-gradient-to-b from-transparent via-gold-400/20 to-transparent" />
        <div className="absolute bottom-[15%] right-[10%] w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="absolute top-[35%] right-[12%] w-20 h-px bg-gradient-to-r from-transparent via-gold-400/15 to-transparent" />

        {/* Large decorative ring — architectural detail */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] border border-white/[0.03] rounded-full" />
        <div className="absolute -top-20 -right-20 w-80 h-80 border border-white/[0.04] rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full px-14 xl:px-20 py-14">
          {/* Top — Brand mark */}
          <div>
            <Link href="/" className="font-display text-2xl font-bold text-white tracking-tight">
              Twedarr
            </Link>
          </div>

          {/* Center — Hero copy */}
          <div className="max-w-md">
            <div className="w-12 h-px bg-gradient-to-r from-gold-400 to-transparent mb-10" />
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-white tracking-headline leading-[1.1] mb-6">
              Your perfect day,
              <br />
              <span className="text-white/40">perfectly planned.</span>
            </h1>
            <p className="text-[15px] leading-[1.8] text-white/40 font-light max-w-sm">
              From venue to vows, Twedarr brings every detail together so you can
              focus on what matters most — celebrating your love.
            </p>
          </div>

          {/* Bottom — Trust metrics */}
          <div className="flex items-center gap-10">
            {[
              { value: "10k+", label: "Happy Couples" },
              { value: "500+", label: "Verified Vendors" },
              { value: "4.9", label: "Average Rating" },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-center gap-10">
                {i > 0 && <div className="w-px h-8 bg-white/[0.08]" />}
                <div>
                  <p className="font-display text-xl font-bold text-white tracking-tight">
                    {value}
                  </p>
                  <p className="text-[11px] uppercase tracking-editorial text-white/30 mt-1">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ━━━ Right — Form Panel ━━━ */}
      <div className="flex-1 lg:flex-none lg:w-[520px] xl:w-[560px] flex items-center justify-center px-6 sm:px-12 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile brand */}
          <div className="lg:hidden mb-12">
            <Link
              href="/"
              className="font-display text-2xl font-bold text-slate-900 tracking-tight"
            >
              Twedarr
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
