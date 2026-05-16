import Link from "next/link";
import {
  FiArrowRight,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiHeart,
  FiMapPin,
  FiMessageCircle,
  FiPieChart,
  FiStar,
  FiZap,
} from "react-icons/fi";
import HomeRedirect from "@/components/home-redirect";

const FEATURES = [
  {
    title: "Verified Local Vendors",
    body: "Every vendor is vetted, verified, and portfolio-ready — so you book with absolute confidence.",
    Icon: FiCheckCircle,
  },
  {
    title: "AI-Powered Matching",
    body: "Intelligent recommendations that understand your style, budget, and vision — not generic search results.",
    Icon: FiZap,
  },
  {
    title: "Real-Time Budget Planner",
    body: "Track every birr with a live budget dashboard. Know exactly where you stand, always.",
    Icon: FiPieChart,
  },
  {
    title: "Seamless Communication",
    body: "Message vendors directly, share inspiration, and coordinate details — all within one conversation thread.",
    Icon: FiMessageCircle,
  },
  {
    title: "Smart Checklist & Timeline",
    body: "Your entire wedding journey mapped out with intelligent milestones that adapt as plans evolve.",
    Icon: FiCalendar,
  },
  {
    title: "Reviews & Portfolios",
    body: "Real reviews from real couples. Browse high-resolution portfolios before making a single commitment.",
    Icon: FiStar,
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Create Your Vision",
    body: "Set your date, define your style, and tell us what matters most. Your wedding story starts here.",
  },
  {
    step: "02",
    title: "Discover & Match",
    body: "Our AI surfaces vendors perfectly aligned with your aesthetic, budget, and location — curated, not cluttered.",
  },
  {
    step: "03",
    title: "Plan & Collaborate",
    body: "Budget in real time, chat directly with vendors, and manage every detail from one elegant workspace.",
  },
  {
    step: "04",
    title: "Celebrate Beautifully",
    body: "Walk into your day knowing every detail has been orchestrated. All that's left is the joy.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Twedarr made planning our wedding feel effortless. We found our dream photographer in minutes.",
    author: "Hana & Daniel",
    detail: "Addis Ababa, 2025",
  },
  {
    quote: "As a vendor, my bookings tripled within the first month. The platform is beautifully designed.",
    author: "Kalkidan Events",
    detail: "Venue & Decor",
  },
  {
    quote: "The budget tracker alone saved us from overspending. Everything just works together seamlessly.",
    author: "Meron & Yonas",
    detail: "Adama, 2025",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-ivory">
      <HomeRedirect />

      {/* ━━━ Navigation ━━━ */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-warm-200/40 bg-ivory/70 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-bold text-slate-900 tracking-tight"
          >
            Twedarr
          </Link>

          <nav className="hidden lg:flex items-center gap-10 text-[13px] font-medium uppercase tracking-editorial text-slate-500">
            <a href="#story" className="hover:text-slate-900 transition-colors duration-300">Story</a>
            <a href="#features" className="hover:text-slate-900 transition-colors duration-300">Features</a>
            <a href="#journey" className="hover:text-slate-900 transition-colors duration-300">Journey</a>
            <a href="#voices" className="hover:text-slate-900 transition-colors duration-300">Voices</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[13px] font-medium uppercase tracking-luxury text-slate-600 hover:text-slate-900 transition-colors duration-300 px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="cursor-pointer inline-flex items-center gap-2 px-7 py-3 bg-slate-900 text-white rounded-full text-[13px] font-semibold uppercase tracking-luxury shadow-[0_2px_20px_rgba(15,23,42,0.15)] hover:bg-slate-800 hover:shadow-[0_4px_30px_rgba(15,23,42,0.25)] transition-all duration-500 hover:-translate-y-px"
            >
              Begin Planning
            </Link>
          </div>
        </div>
      </header>

      {/* ━━━ Hero — Cinematic Full-Viewport ━━━ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Atmospheric layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(201,168,76,0.06),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_80%,rgba(251,113,133,0.05),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-champagne-100/30 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Overline */}
            <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-editorial text-gold-500 mb-8 animate-reveal-down">
              The Future of Wedding Planning
            </p>

            {/* Main headline */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold text-slate-900 tracking-headline leading-[1.05] mb-8 animate-reveal-up">
              Where Every Detail{" "}
              <span className="relative inline-block">
                Becomes
                <span className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-400 to-transparent rounded-full" />
              </span>{" "}
              Unforgettable
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl md:text-[1.375rem] text-slate-500 leading-relaxed max-w-2xl mx-auto mb-14 font-light animate-reveal-up [animation-delay:200ms]">
              Twedarr connects you with Ethiopia&#8217;s finest verified vendors,
              intelligent planning tools, and a seamless experience crafted for
              the most important day of your life.
            </p>

            {/* CTA pair */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-reveal-up [animation-delay:400ms]">
              <Link
                href="/register"
                className="cursor-pointer group inline-flex items-center gap-3 px-10 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-full text-[15px] font-semibold shadow-[0_4px_30px_rgba(15,23,42,0.2)] hover:shadow-[0_8px_50px_rgba(15,23,42,0.3)] transition-all duration-700 hover:-translate-y-0.5"
              >
                Start Planning Your Wedding
                <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/register?role=vendor"
                className="cursor-pointer inline-flex items-center gap-2 px-9 py-4.5 border border-slate-200 rounded-full text-[15px] font-semibold text-slate-700 bg-white/60 backdrop-blur-sm hover:border-gold-400/50 hover:bg-white hover:shadow-[0_4px_20px_rgba(201,168,76,0.1)] transition-all duration-500"
              >
                Join as a Vendor
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 sm:gap-12 mt-20 animate-reveal-up [animation-delay:600ms]">
              {[
                { Icon: FiCamera, label: "Photography" },
                { Icon: FiMapPin, label: "Venues" },
                { Icon: FiHeart, label: "Decor" },
                { Icon: FiStar, label: "Catering" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2.5 group">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-warm-200/60 flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.04)] group-hover:border-gold-400/40 group-hover:shadow-[0_4px_16px_rgba(201,168,76,0.08)] transition-all duration-500">
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-gold-500 transition-colors duration-500" aria-hidden />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-editorial text-slate-400 group-hover:text-slate-600 transition-colors duration-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ivory to-transparent pointer-events-none" />
      </section>

      {/* ━━━ Editorial Divider ━━━ */}
      <div className="flex items-center justify-center py-4">
        <div className="h-px w-20 bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      </div>

      {/* ━━━ The Story — Problem as Narrative ━━━ */}
      <section id="story" className="py-28 md:py-40">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-500 mb-6">
              The Challenge
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-headline leading-[1.15] mb-10">
              Planning a wedding should feel like falling in love —{" "}
              <span className="text-slate-400">not managing a crisis.</span>
            </h2>
            <p className="text-lg sm:text-xl text-slate-500 leading-[1.8] font-light">
              Couples and families across Ethiopia navigate fragmented vendor
              networks, opaque pricing, and disconnected planning tools.
              The result? Overspending, overwhelm, and a process that steals
              joy from one of life&#8217;s most meaningful milestones.
            </p>
            <div className="mt-12 h-px w-16 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto" />
          </div>

          {/* Pain-point cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl mx-auto">
            {[
              {
                stat: "73%",
                label: "of couples exceed their budget due to hidden vendor costs and lack of price transparency.",
              },
              {
                stat: "5+",
                label: "separate apps, spreadsheets, and group chats couples juggle to coordinate a single wedding.",
              },
              {
                stat: "Zero",
                label: "centralized platforms exist for Ethiopian couples to discover, compare, and book verified vendors.",
              },
            ].map(({ stat, label }) => (
              <div
                key={stat}
                className="relative group rounded-3xl border border-warm-200/50 bg-white/40 backdrop-blur-sm p-10 hover:border-warm-200 hover:bg-white/70 hover:shadow-[0_8px_40px_rgba(15,23,42,0.04)] transition-all duration-700"
              >
                <p className="font-display text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-headline">
                  {stat}
                </p>
                <p className="text-slate-500 text-[15px] leading-relaxed font-light">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Features — Editorial Grid ━━━ */}
      <section id="features" className="py-28 md:py-40 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl mx-auto text-center mb-20 md:mb-28">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-500 mb-6">
              Capabilities
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-headline leading-[1.15] mb-8">
              Everything you need,{" "}
              <span className="text-slate-400">nothing you don&#8217;t.</span>
            </h2>
            <p className="text-lg text-slate-500 leading-relaxed font-light max-w-2xl mx-auto">
              Six deeply considered capabilities — each designed to remove friction
              and add delight to your planning experience.
            </p>
          </div>

          <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-warm-200/30 rounded-[2rem] overflow-hidden list-none p-0 m-0 border border-warm-200/40">
            {FEATURES.map(({ title, body, Icon }) => (
              <li
                key={title}
                className="bg-white p-10 md:p-12 group hover:bg-champagne-50/30 transition-colors duration-700"
              >
                <div className="w-14 h-14 rounded-2xl bg-warm-50 border border-warm-200/50 flex items-center justify-center mb-8 group-hover:border-gold-400/30 group-hover:bg-gold-50 transition-all duration-700">
                  <Icon className="w-6 h-6 text-slate-400 group-hover:text-gold-500 transition-colors duration-700" aria-hidden />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900 mb-3 tracking-tight">
                  {title}
                </h3>
                <p className="text-slate-500 text-[15px] leading-[1.7] font-light">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ━━━ How It Works — Cinematic Steps ━━━ */}
      <section id="journey" className="py-28 md:py-40 gradient-editorial-dark text-white overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl mx-auto text-center mb-20 md:mb-28">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-400 mb-6">
              Your Journey
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-headline leading-[1.15] mb-8">
              From first spark{" "}
              <span className="text-white/40">to final dance.</span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed font-light max-w-2xl mx-auto">
              Four intentional steps that transform wedding planning from
              overwhelming to extraordinary.
            </p>
          </div>

          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 list-none p-0 m-0">
            {STEPS.map(({ step, title, body }, i) => (
              <li key={step} className="relative p-10 md:p-12 group">
                {/* Connector line between steps */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-16 right-0 w-full h-px bg-gradient-to-r from-white/10 to-white/5 pointer-events-none" />
                )}

                <span className="text-[11px] font-semibold uppercase tracking-editorial text-gold-400/70 mb-6 block">
                  Step {step}
                </span>
                <h3 className="font-display text-2xl font-semibold text-white mb-4 tracking-tight">
                  {title}
                </h3>
                <p className="text-white/45 text-[15px] leading-[1.7] font-light">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ━━━ Dual Audience — Side-by-side Editorial ━━━ */}
      <section className="py-28 md:py-40">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-500 mb-6">
              Built For
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-headline leading-[1.15]">
              Two sides of the same{" "}
              <span className="text-slate-400">beautiful story.</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Couples Card */}
            <div className="relative group rounded-[2rem] border border-warm-200/50 bg-gradient-to-br from-white via-white to-champagne-50/50 p-12 md:p-16 hover:border-warm-200 hover:shadow-[0_12px_60px_rgba(15,23,42,0.05)] transition-all duration-700 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-rose-100/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <FiHeart className="w-8 h-8 text-rose-300 mb-8" strokeWidth={1.5} aria-hidden />
                <h3 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  For Couples &amp; Families
                </h3>
                <p className="text-slate-500 text-[15px] leading-[1.8] font-light mb-10">
                  Discover verified vendors that match your vision. Compare
                  transparent pricing, communicate directly, and manage your
                  entire budget — all from a single, elegant workspace designed
                  for how you actually plan.
                </p>
                <Link
                  href="/register"
                  className="cursor-pointer inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-luxury text-slate-900 group-hover:text-rose-600 transition-colors duration-500"
                >
                  Start planning
                  <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Vendors Card */}
            <div className="relative group rounded-[2rem] border border-warm-200/50 bg-gradient-to-br from-white via-white to-gold-50/50 p-12 md:p-16 hover:border-warm-200 hover:shadow-[0_12px_60px_rgba(15,23,42,0.05)] transition-all duration-700 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-200/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <FiStar className="w-8 h-8 text-gold-400 mb-8" strokeWidth={1.5} aria-hidden />
                <h3 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  For Local Vendors
                </h3>
                <p className="text-slate-500 text-[15px] leading-[1.8] font-light mb-10">
                  Showcase your portfolio to engaged couples actively searching.
                  Receive qualified inquiries, manage bookings, and build a
                  verified reputation that compounds — turning your craft into
                  a thriving, visible brand.
                </p>
                <Link
                  href="/register?role=vendor"
                  className="cursor-pointer inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-luxury text-slate-900 group-hover:text-gold-600 transition-colors duration-500"
                >
                  Join as vendor
                  <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Why Twedarr — Editorial Manifesto ━━━ */}
      <section id="about" className="py-28 md:py-40 bg-white border-y border-warm-200/40">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-500 mb-6">
                Our Belief
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-headline leading-[1.15]">
                We believe wedding planning{" "}
                <span className="text-slate-400">deserves better.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-16 md:gap-12">
              {[
                {
                  title: "Accessible Excellence",
                  body: "Every couple deserves access to high-quality, fairly-priced wedding services — regardless of their budget size or social connections.",
                },
                {
                  title: "Radical Transparency",
                  body: "No hidden fees. No opaque negotiations. Clear pricing, honest reviews, and verified credentials create trust that transforms the industry.",
                },
                {
                  title: "Digital Transformation",
                  body: "Ethiopia's event industry is ready for its digital moment. Twedarr is building the infrastructure for a new era of celebration.",
                },
              ].map(({ title, body }) => (
                <div key={title}>
                  <h3 className="font-display text-lg font-semibold text-slate-900 mb-4 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-slate-500 text-[15px] leading-[1.8] font-light">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ Testimonials — Voice of Trust ━━━ */}
      <section id="voices" className="py-28 md:py-40">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-500 mb-6">
              Voices
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-headline leading-[1.15]">
              Trusted by those who{" "}
              <span className="text-slate-400">matter most.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {TESTIMONIALS.map(({ quote, author, detail }) => (
              <div
                key={author}
                className="rounded-3xl border border-warm-200/50 bg-white/50 backdrop-blur-sm p-10 md:p-12 hover:border-warm-200 hover:bg-white/80 hover:shadow-[0_8px_40px_rgba(15,23,42,0.04)] transition-all duration-700"
              >
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-3.5 h-3.5 text-gold-400 fill-gold-400"
                      aria-hidden
                    />
                  ))}
                </div>
                <blockquote className="text-slate-600 text-[15px] leading-[1.8] font-light mb-8">
                  &#8220;{quote}&#8221;
                </blockquote>
                <div>
                  <p className="font-display text-sm font-semibold text-slate-900">{author}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ Final CTA — The Invitation ━━━ */}
      <section className="py-32 md:py-44 gradient-editorial-dark text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_60%,rgba(201,168,76,0.06),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-editorial text-gold-400 mb-8">
            Your Story Awaits
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-headline leading-[1.1] mb-8">
            Begin the most beautiful chapter.
          </h2>
          <p className="text-lg text-white/45 leading-relaxed font-light max-w-xl mx-auto mb-14">
            Join thousands of couples and vendors who are reimagining what
            wedding planning can feel like.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/register"
              className="cursor-pointer group inline-flex items-center gap-3 px-10 py-4.5 bg-white text-slate-900 rounded-full text-[15px] font-semibold shadow-[0_4px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_50px_rgba(255,255,255,0.2)] transition-all duration-700 hover:-translate-y-0.5"
            >
              Start Planning Free
              <FiArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/register?role=vendor"
              className="cursor-pointer inline-flex items-center px-9 py-4.5 border border-white/15 rounded-full text-[15px] font-semibold text-white/70 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all duration-500"
            >
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ Footer — Refined & Minimal ━━━ */}
      <footer className="border-t border-warm-200/40 bg-ivory py-16 md:py-20">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
            {/* Brand */}
            <div className="lg:max-w-sm">
              <Link href="/" className="font-display text-xl font-bold text-slate-900 tracking-tight">
                Twedarr
              </Link>
              <p className="text-sm text-slate-400 font-light leading-relaxed mt-4">
                The intelligent wedding planning platform — connecting
                Ethiopia&#8217;s finest vendors with couples who deserve
                an exceptional experience.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-x-16 gap-y-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-4">
                  Platform
                </p>
                <ul className="space-y-3 list-none p-0 m-0">
                  <li><Link href="/register" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">For Couples</Link></li>
                  <li><Link href="/register?role=vendor" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">For Vendors</Link></li>
                  <li><a href="#features" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">Features</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-editorial text-slate-400 mb-4">
                  Company
                </p>
                <ul className="space-y-3 list-none p-0 m-0">
                  <li><a href="#about" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">About</a></li>
                  <li><a href="mailto:hello@twedarr.com" className="text-sm text-slate-500 hover:text-slate-900 transition-colors duration-300">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t border-warm-200/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-[12px] text-slate-400 font-light">
              &copy; {new Date().getFullYear()} Twedarr. All rights reserved.
            </p>
            <p className="text-[11px] text-slate-300 font-light">
              Adama Science and Technology University — Graduation Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
