import Link from "next/link";
import { FiArrowLeft, FiHeart } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-white to-rose-25/60">
      <div className="text-center max-w-md">
        <div className="relative mx-auto mb-8 w-28 h-28">
          <span className="absolute inset-0 rounded-full bg-rose-100/70 animate-ping opacity-20" />
          <div className="relative w-full h-full rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center">
            <FiHeart className="w-10 h-10 text-rose-400" strokeWidth={1.5} />
          </div>
        </div>

        <p className="text-7xl font-display font-bold text-rose-300 mb-3 select-none">404</p>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Page not found
        </h1>

        <p className="text-slate-500 leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-sm font-semibold shadow-[0_2px_12px_rgba(244,63,94,0.28)] transition-all hover:from-rose-600 hover:to-rose-700 hover:-translate-y-0.5"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            href="/login"
            className="px-7 py-3 border-[1.5px] border-slate-200 rounded-xl text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>

      <p className="mt-16 text-xs text-slate-400">
        Twedarr — Smart Wedding Planning Platform
      </p>
    </div>
  );
}
