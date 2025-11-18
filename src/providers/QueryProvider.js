"use client";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { useEffect } from 'react';
import { setupPersistence } from '@/lib/persistQueryClient';

export function QueryProvider({ children }) {
  useEffect(() => {
    // Setup persistence on mount
    setupPersistence(queryClient);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
