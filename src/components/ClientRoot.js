"use client";

import { ClientLayout } from "@/components/ClientLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import GlobalErrorFallback from "@/components/GlobalErrorFallback";
import dynamic from "next/dynamic";

const DynamicNavbar = dynamic(
  () => import("@/components/Navbar").then((mod) => mod.Navbar),
  {
    loading: () => <div className="h-16 bg-background border-b" />,
    ssr: false,
  }
);

const DynamicToaster = dynamic(
  () => import("@/components/ui/toaster").then((mod) => mod.Toaster),
  {
    loading: () => null,
    ssr: false,
  }
);

export default function ClientRoot({ children }) {
  return (
    <ErrorBoundary 
      fallback={({ error, errorInfo, onRetry }) => (
        <GlobalErrorFallback 
          error={error} 
          errorInfo={errorInfo} 
          onRetry={onRetry} 
        />
      )}
    >
      <ClientLayout>
        <ProtectedRoute>
          <div className="min-h-screen flex flex-col">
            <DynamicNavbar />
            <main className="flex-1">{children}</main>
          </div>
        </ProtectedRoute>
      </ClientLayout>
      <DynamicToaster />
    </ErrorBoundary>
  );
}
