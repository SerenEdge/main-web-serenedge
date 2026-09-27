import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "lenis/dist/lenis.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${candid.variable}`}>
      <body className="bg-white font-sans text-base leading-normal text-ink antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
