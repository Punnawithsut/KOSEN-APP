import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { DevServiceWorkerReset } from "@/components/dev-service-worker-reset";
import { cn } from "@/lib/utils";

// Must be `--font-inter`, NOT `--font-sans`.
//
// `globals.css` declares `--font-sans: var(--font-inter)` inside `@theme inline`,
// so every `font-sans` utility compiles to `font-family: var(--font-inter)`.
// Loading Inter under the name `--font-sans` left `--font-inter` undefined, the
// declaration was invalid at computed-value time, and the entire app — navbar,
// headings, cards — silently fell back to the browser's default serif.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif used by the announcement hero headline ("What's new?").
// Instrument Serif ships a single weight (400).
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "KOSEN App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KOSEN App",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        instrumentSerif.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {/* Dev-only: clears a service worker left behind by `npm start`, which
            otherwise serves stale chunks and breaks hydration. Renders nothing
            and is a no-op in production. */}
        <DevServiceWorkerReset />
        {children}
      </body>
    </html>
  );
}
