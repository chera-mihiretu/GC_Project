import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${playfair.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-warm-50 text-slate-800 font-body antialiased">
        <ImpersonationBanner />
        {children}
      </body>
    </html>
  );
}
