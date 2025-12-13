"use client";

import { Button } from "@/components/ui/button";
import { Home, RefreshCw } from "lucide-react";

export default function GlobalErrorFallback({ error, onRetry }) {
  return (
    <div
      className="flex h-screen w-full flex-col items-center justify-center bg-background text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">
          Something went wrong
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          We're sorry, but an unexpected error occurred. Please try again or
          return to the homepage.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="text-left max-w-[600px] mx-auto">
            <summary>Error Details</summary>
            <pre className="mt-2 text-sm text-red-500 whitespace-pre-wrap">
              {error?.message}
            </pre>
          </details>
        )}
        <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
          <Button onClick={onRetry} aria-label="Retry loading the page">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            aria-label="Go to the homepage"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}