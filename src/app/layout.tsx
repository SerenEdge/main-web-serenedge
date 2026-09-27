import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "lenis/dist/lenis.css";
import { CheatModal } from "@/components/easter-eggs/CheatModal";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SceneBackground } from "@/scene/SceneBackground";

const geist = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});
const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
});
// Declared at 300 exactly like the mock; headings request 700 and get the same synthetic bold.
const candid = localFont({
  src: "./fonts/candid.otf",
  weight: "300",
  variable: "--font-candid",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://serenedge.com"),
  title: { default: "SerenEdge · IT studio from Sri Lanka", template: "%s · SerenEdge" },
  description:
    "SerenEdge is a deeply technical IT studio from Sri Lanka. Web platforms, IoT fleets, automations, custom systems and ML models, built by one team end to end.",
  openGraph: { type: "website", siteName: "SerenEdge", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${candid.variable}`}>
      <body className="bg-white font-sans text-base leading-normal text-ink antialiased">
        <SmoothScroll>
          <a
            href="#main"
            className="absolute -top-16 left-4 z-[100] rounded-md bg-ink px-4 py-2.5 text-white transition-[top] focus:top-3"
          >
            Skip to content
          </a>
          <SceneBackground />
          <Nav />
          <main id="main" tabIndex={-1} className="relative z-[1] focus:outline-none">
            {children}
          </main>
          <Footer />
          <CheatModal />
        </SmoothScroll>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
