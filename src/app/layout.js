import { Geist } from "next/font/google";
import "./globals.css";
import ClientRoot from "@/components/ClientRoot";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import GlobalErrorFallback from "@/components/GlobalErrorFallback";

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

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.className}>
      <body>
        <ErrorBoundary fallback={<GlobalErrorFallback />}>
          <Suspense fallback={<div>Loading...</div>}>
            <ClientRoot>{children}</ClientRoot>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
