import Link from "next/link";
import { FiHeart, FiArrowRight } from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-white to-rose-50">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-8">
          <FiHeart className="w-7 h-7" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          Twedarr
        </h1>
        <p className="text-lg text-slate-500 mb-10 leading-relaxed">
          Your AI-powered wedding planning companion. Plan, organize, and celebrate
          your perfect day — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-[15px] font-semibold shadow-[0_2px_8px_rgba(244,63,94,0.25)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_16px_rgba(244,63,94,0.35)] hover:-translate-y-0.5"
          >
            Get started
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 border-[1.5px] border-slate-200 rounded-xl text-[15px] font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
