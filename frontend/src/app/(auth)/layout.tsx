import { FiHeart } from "react-icons/fi";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-linear-to-br from-slate-50 to-rose-50/30">
      {/* Hero panel */}
      <div className="hidden lg:flex relative flex-1 bg-linear-to-br from-rose-400 via-rose-500 to-pink-600 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-linear-to-t from-rose-600/50 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />

        {/* Floating decorative elements */}
        <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-[25%] right-[15%] w-2 h-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[30%] left-[20%] w-4 h-4 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[60%] right-[25%] w-2.5 h-2.5 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

        {/* Decorative rings */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 border-[3px] border-white/10 rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 border-2 border-white/15 rounded-full" />
        <div className="absolute -bottom-8 -right-8 w-48 h-48 border border-white/10 rounded-full" />
        
        {/* Top decorative ring */}
        <div className="absolute -top-16 -left-16 w-64 h-64 border-2 border-white/8 rounded-full" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-16 text-white max-w-xl">
          {/* Wedding rings icon */}
          <div className="flex items-center gap-1 mb-8">
            <div className="w-10 h-10 rounded-full border-2 border-white/40 -mr-3" />
            <div className="w-10 h-10 rounded-full border-2 border-white/40" />
          </div>

          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 tracking-tight">
            Your perfect day,
            <br />
            <span className="text-white/90">perfectly planned.</span>
          </h1>
          
          <p className="text-lg leading-relaxed text-white/80 max-w-md">
            From venue to vows, Twedar brings every detail together so you can
            focus on what matters most: celebrating your love.
          </p>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-white/15">
            <div className="text-center">
              <p className="text-2xl font-bold">10k+</p>
              <p className="text-sm text-white/70">Happy Couples</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-sm text-white/70">Vendors</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">4.9</p>
              <p className="text-sm text-white/70">Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 lg:flex-none lg:w-[480px] xl:w-[520px] flex items-center justify-center px-6 sm:px-10 py-10">
        <div className="w-full max-w-[380px]">
          {/* Brand */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 bg-linear-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <FiHeart className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              Twedar
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
