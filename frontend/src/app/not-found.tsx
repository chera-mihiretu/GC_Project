"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: 24 }, (_, i) => ({
    id: i,
    size: 2 + Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 5,
  }));
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(generateParticles());
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-ivory relative overflow-hidden">
      {/* Atmospheric background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_30%,rgba(201,168,76,0.04),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_80%,rgba(251,113,133,0.03),transparent_50%)]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-champagne-100/20 blur-[100px] pointer-events-none" />

      {/* Floating particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            background:
              p.id % 3 === 0
                ? "rgba(201,168,76,0.15)"
                : p.id % 3 === 1
                  ? "rgba(251,113,133,0.1)"
                  : "rgba(148,163,184,0.1)",
            animation: `softFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Geometric accents */}
      <div className="absolute top-[15%] left-[12%] w-px h-24 bg-gradient-to-b from-transparent via-gold-400/15 to-transparent animate-pulse-glow" />
      <div className="absolute bottom-[20%] right-[10%] w-px h-20 bg-gradient-to-b from-transparent via-warm-200/30 to-transparent animate-pulse-glow [animation-delay:1.5s]" />
      <div className="absolute top-[40%] right-[15%] w-16 h-px bg-gradient-to-r from-transparent via-gold-400/10 to-transparent animate-pulse-glow [animation-delay:3s]" />
      <div className="absolute bottom-[35%] left-[8%] w-12 h-px bg-gradient-to-r from-transparent via-rose-200/15 to-transparent animate-pulse-glow [animation-delay:2s]" />

      {/* Decorative ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-warm-200/20 rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-warm-200/10 rounded-full pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Overline */}
        <p
          className={`text-[11px] font-semibold uppercase tracking-editorial text-gold-500/70 mb-10 transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          Page Not Found
        </p>

        {/* The 404 — massive, cinematic */}
        <div
          className={`relative mb-8 transition-all duration-1000 [transition-delay:200ms] ${
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <p className="text-[10rem] sm:text-[12rem] md:text-[14rem] font-display font-bold leading-none select-none tracking-headline gradient-gold-text">
            404
          </p>

          {/* Subtle glow behind the number */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-60 h-60 rounded-full bg-gold-200/10 blur-[80px] animate-pulse-glow" />
          </div>
        </div>

        {/* Gold divider */}
        <div
          className={`flex justify-center mb-10 transition-all duration-1000 [transition-delay:400ms] ${
            mounted ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
          }`}
        >
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        </div>

        {/* Headline */}
        <h1
          className={`font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-headline leading-tight mb-5 transition-all duration-1000 [transition-delay:500ms] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          This page has wandered off.
        </h1>

        {/* Subtext */}
        <p
          className={`text-[15px] sm:text-base text-slate-400 leading-relaxed font-light max-w-sm mx-auto mb-14 transition-all duration-1000 [transition-delay:650ms] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          The page you&#8217;re looking for doesn&#8217;t exist or has been
          moved. Let&#8217;s guide you back to where the magic happens.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 [transition-delay:800ms] ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link
            href="/"
            className="cursor-pointer group inline-flex items-center gap-3 px-9 py-4 bg-slate-900 text-white rounded-full text-[14px] font-semibold shadow-[0_4px_30px_rgba(15,23,42,0.15)] hover:bg-slate-800 hover:shadow-[0_8px_40px_rgba(15,23,42,0.25)] transition-all duration-700 hover:-translate-y-0.5"
          >
            <FiArrowLeft className="w-4 h-4 transition-transform duration-500 group-hover:-translate-x-1" aria-hidden />
            Back to home
          </Link>
          <Link
            href="/login"
            className="cursor-pointer inline-flex items-center px-9 py-4 border border-warm-200/60 rounded-full text-[14px] font-semibold text-slate-600 bg-white/60 backdrop-blur-sm hover:border-warm-200 hover:bg-white hover:shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-500"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Bottom brand */}
      <p
        className={`absolute bottom-8 text-[11px] uppercase tracking-editorial text-slate-300 font-light transition-all duration-1000 [transition-delay:1000ms] ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        Twedarr
      </p>
    </div>
  );
}
