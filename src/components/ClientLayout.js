"use client";
import { QueryProvider } from "@/providers/QueryProvider";
import { useState, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export function ClientLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
