import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Nav from "@/components/Nav";
import { ToastProvider } from "@/components/Toast";
import PWAInit from "@/components/PWAInit";
import AlertPushBridge from "@/components/AlertPushBridge";

export const metadata: Metadata = {
  title: "Caregiver Dashboard",
  description: "Live health and safety monitoring for the wearable device.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Caregiver",
    statusBarStyle: "default"
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <ToastProvider>
          <Nav />
          <main className="max-w-2xl mx-auto px-4 pb-24 sm:pb-10 pt-4">
            {children}
          </main>
          <PWAInit />
          <AlertPushBridge />
        </ToastProvider>
      </body>
    </html>
  );
}
