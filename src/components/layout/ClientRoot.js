"use client";

import { ClientLayout } from "@/components/layout/ClientLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import GlobalErrorFallback from "@/components/shared/GlobalErrorFallback";
import dynamic from "next/dynamic";
import { AuthProvider } from "@/contexts/AuthContext";

const DynamicNavbar = dynamic(
  () => import("@/components/layout/Navbar").then((mod) => mod.Navbar),
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

const DynamicOfflineIndicator = dynamic(
  () => import("@/components/shared/OfflineIndicator").then((mod) => mod.OfflineIndicator),
  {
    loading: () => null,
    ssr: false,
  }
);

const DynamicDevTools = dynamic(
  () => import("@/components/shared/DevTools").then((mod) => mod.DevTools),
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
      <AuthProvider>
        <ClientLayout>
          <ProtectedRoute>
            <div className="min-h-screen flex flex-col">
              <DynamicNavbar />
              <main className="flex-1">{children}</main>
            </div>
          </ProtectedRoute>
        </ClientLayout>
        <DynamicToaster />
        <DynamicOfflineIndicator />
        <DynamicDevTools />
      </AuthProvider>
    </ErrorBoundary>
  );
}
