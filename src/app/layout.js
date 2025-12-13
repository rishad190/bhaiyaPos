import { Geist } from "next/font/google";
import "./globals.css";
import ClientRoot from "@/components/layout/ClientRoot";
import { Suspense } from "react";

const geist = Geist({
  subsets: ["latin"],
  display: "swap", // Improves font loading performance
  preload: true,
});

// Add metadata configuration
export const metadata = {
  title: {
    default: "Sky Fabric",
    template: "%s | POS System",
  },
  description:
    "A modern Point of Sale system for managing customers and transactions",
  keywords: ["POS", "point of sale", "customer management", "transactions"],
  authors: [{ name: "Md Rishad Khan" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sky Fabric POS",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

// Viewport configuration (separate from metadata in Next.js 14+)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.className}>
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientRoot>{children}</ClientRoot>
        </Suspense>
      </body>
    </html>
  );
}
