import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiCoffee,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiPieChart,
  FiStar,
  FiZap,
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-white via-rose-25/40 to-warm-50">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl font-semibold text-slate-900 tracking-tight"
          >
            Twedarr
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-rose-600 transition-colors">
              Problem
            </a>
            <a href="#features" className="hover:text-rose-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-rose-600 transition-colors">
              How it works
            </a>
            <a href="#beneficiaries" className="hover:text-rose-600 transition-colors">
              Who benefits
            </a>
            <a href="#about" className="hover:text-rose-600 transition-colors">
              About
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-2 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl shadow-sm transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(251,113,133,0.18),transparent)] pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid lg:grid-cols-[1fr,1.05fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-rose-600 mb-3">
                Smart wedding planning — in one place
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Twedarr – Smart Wedding Planning Platform
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
                Plan your dream wedding with verified local vendors, AI-powered recommendations,
                and real-time budgeting — all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-linear-to-r from-rose-500 to-rose-600 text-white rounded-xl text-[15px] font-semibold shadow-[0_2px_12px_rgba(244,63,94,0.28)] transition-all hover:from-rose-600 hover:to-rose-700 hover:shadow-[0_4px_20px_rgba(244,63,94,0.35)] hover:-translate-y-0.5"
                >
                  Start Planning for Free
                  <FiArrowRight className="w-4 h-4" aria-hidden />
                </Link>
                <Link
                  href="/register?role=vendor"
                  className="inline-flex items-center justify-center px-7 py-3.5 border-[1.5px] border-slate-200 rounded-xl text-[15px] font-semibold text-slate-800 bg-white/80 hover:border-rose-200 hover:bg-rose-50/80 transition-all"
                >
                  Join as a Vendor
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-br from-rose-100/50 to-champagne-100/80 rounded-4xl blur-2xl opacity-70" />
              <div className="relative rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] p-6 sm:p-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-linear-to-br from-rose-100 via-champagne-50 to-rose-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23fda4af%22%20fill-opacity%3D%220.15%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
                    <FiHeart className="relative w-20 h-20 text-rose-400/90 drop-shadow-sm" strokeWidth={1.25} aria-hidden />
                    <span className="sr-only">Happy couple — illustration</span>
                  </div>
                  <div className="flex flex-col gap-4 justify-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Verified vendors
                    </p>
                    <p className="text-sm text-slate-600 leading-snug">
                      Connect with photographers, venues, caterers, and more — matched to your style
                      and budget.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { Icon: FiCamera, label: "Photographer" },
                        { Icon: FiMapPin, label: "Venue" },
                        { Icon: FiCoffee, label: "Caterer" },
                      ].map(({ Icon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-medium text-rose-800"
                        >
                          <Icon className="w-3.5 h-3.5 text-rose-500" aria-hidden />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-y border-slate-200/80 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-4 text-center">
            Weddings shouldn&apos;t be stressful
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto leading-relaxed">
            Couples and families frequently overpay for wedding services due to lack of
            transparent price comparison, centralized verified vendor access, and effective
            communication tools.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Twedarr offers
            </h2>
            <p className="text-slate-600">
              A smart, integrated digital platform that streamlines the entire wedding journey —
              connecting you with verified local vendors, centralizing budgeting and planning,
              reviews and portfolios, and direct chat.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 list-none p-0 m-0">
            {[
              {
                title: "Verified Local Vendors",
                body: "Connect with verified photographers, venues, caterers, and more.",
                Icon: FiCheckCircle,
              },
              {
                title: "AI Smart Recommendations",
                body: "AI-based vendor matching and cost optimization.",
                Icon: FiZap,
              },
              {
                title: "Budget Planner",
                body: "User-friendly budget planner to plan and track expenses.",
                Icon: FiPieChart,
              },
              {
                title: "Direct Chat",
                body: "In-app chat and real-time communication with vendors.",
                Icon: FiMessageCircle,
              },
              {
                title: "Checklist & timeline",
                body: "Stay on track with tasks, milestones, and a clear timeline for your wedding.",
                Icon: FiCalendar,
              },
              {
                title: "Reviews & Portfolios",
                body: "Reviews and feedback plus searchable vendor portfolios.",
                Icon: FiStar,
              },
            ].map(({ title, body, Icon }) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:border-rose-200/80 hover:shadow-[0_8px_30px_rgba(244,63,94,0.08)] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-rose-100 to-rose-50 flex items-center justify-center text-rose-600 mb-4">
                  <Icon className="w-6 h-6" aria-hidden />
                </div>
                <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-champagne-50/80 border-y border-champagne-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            How it works
          </h2>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 list-none p-0 m-0">
            {[
              {
                step: "1",
                title: "Sign Up",
                body: "Couples or vendors register and set up their profile.",
              },
              {
                step: "2",
                title: "Find & Match",
                body: "Smart search plus AI recommendations surface the right vendors.",
              },
              {
                step: "3",
                title: "Plan & Chat",
                body: "Budget together and message vendors in real time.",
              },
              {
                step: "4",
                title: "Celebrate",
                body: "Coordinate final details with vendors and enjoy your day with less stress.",
              },
            ].map(({ step, title, body }) => (
              <li key={step} className="relative">
                <div className="flex flex-col items-start">
                  <span className="text-4xl font-display font-bold text-rose-200 mb-3 select-none">
                    {step}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-slate-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Beneficiaries */}
      <section id="beneficiaries" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Who benefits
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {[
              {
                title: "Couples & Families",
                body: "Compare, select, communicate with vendors and optimize costs.",
              },
              {
                title: "Local Vendors",
                body: "Gain visibility, receive client inquiries, and build reputation through verified profiles.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
              >
                <h3 className="font-display text-xl font-semibold text-slate-900 mb-3">{title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why / About */}
      <section id="about" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-10 text-center">
            Why Twedarr?
          </h2>
          <ul className="grid sm:grid-cols-3 gap-8 text-center list-none p-0 m-0">
            {[
              "Affordable, high-quality wedding services",
              "Transparency and stress-free planning",
              "Digital transformation for the event industry in Ethiopia",
            ].map((line) => (
              <li
                key={line}
                className="rounded-xl bg-white/5 border border-white/10 px-6 py-8 text-slate-100 text-sm md:text-base leading-relaxed"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section id="testimonials" className="py-16 md:py-20 border-t border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Loved by couples &amp; vendors
          </h2>
          <p className="text-slate-500 mb-10 max-w-xl mx-auto text-sm md:text-base">
            Reviews and feedback help everyone plan with confidence. Real testimonials will appear
            here as the Twedarr community grows.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-slate-400 text-sm"
              >
                Review placeholder
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-12 bg-warm-100/50 border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-slate-600 text-sm">
            Questions about Twedarr?{" "}
            <a
              href="mailto:hello@twedarr.com"
              className="font-semibold text-rose-600 hover:text-rose-700"
            >
              hello@twedarr.com
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            <Link href="/register" className="hover:text-rose-600 transition-colors">
              For Couples
            </Link>
            <Link href="/register?role=vendor" className="hover:text-rose-600 transition-colors">
              For Vendors
            </Link>
            <a href="#features" className="hover:text-rose-600 transition-colors">
              Features
            </a>
            <a href="#about" className="hover:text-rose-600 transition-colors">
              About
            </a>
            <a href="#contact" className="hover:text-rose-600 transition-colors">
              Contact
            </a>
          </div>
          <div className="text-center md:text-right text-sm text-slate-500 space-y-1">
            <p>Twedarr © 2025</p>
            <p className="text-xs text-slate-400">
              Graduation Project – Adama Science and Technology University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
