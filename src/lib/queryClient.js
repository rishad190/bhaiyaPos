import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      // Enable network mode for offline support
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      // Queue mutations when offline
      networkMode: 'offlineFirst',
    },
  },
});
