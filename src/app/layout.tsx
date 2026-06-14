import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Network Marketing Master",
  description: "Ağ pazarlaması takip uygulaması",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png",    sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NMM",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#534AB7",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
            <Toaster richColors position="top-center" />
          </ThemeProvider>
        </LanguageProvider>
        {/* Vercel Real-User Monitoring — cookieless (KVKK/GDPR uyumlu). SpeedInsights:
            Web Vitals + p75 TTFB rota bazında (perf regresyon takibi, docs/performance.md
            §3). Analytics: sayfa görüntüleme. Yalnızca Vercel'de veri gönderir, görsel yok. */}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

