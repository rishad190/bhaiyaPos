import { Geist } from "next/font/google";
import "./globals.css";
import ClientRoot from "@/components/ClientRoot";
import { Suspense } from "react";

const geist = Geist({
  subsets: ["latin"],
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
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sky Fabric POS",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
