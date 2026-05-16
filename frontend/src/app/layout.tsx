import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import ImpersonationBanner from "@/components/impersonation-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Twedarr — Smart Wedding Planning Platform",
  description:
    "Plan your dream wedding with verified local vendors, AI-powered recommendations, and real-time budgeting — all in one place.",
  metadataBase: new URL("https://twedarr.com"),
  applicationName: "Twedarr",
  other: {
    "theme-color": "#e11d48",
    "msapplication-TileColor": "#e11d48",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-warm-50 text-slate-800 font-body antialiased">
        <NextTopLoader
          color="#c9a84c"
          height={2}
          shadow="0 0 10px rgba(201,168,76,0.35),0 0 5px rgba(201,168,76,0.2)"
          showSpinner={false}
          crawlSpeed={250}
          easing="cubic-bezier(0.16, 1, 0.3, 1)"
        />
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
