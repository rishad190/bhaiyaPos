"use client";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
import logger from '@/utils/logger';

// Create IndexedDB persister for better offline support
export function createIDBPersister() {
  return {
    persistClient: async (client) => {
      await set('react-query-cache', client);
    },
    restoreClient: async () => {
      return await get('react-query-cache');
    },
    removeClient: async () => {
      await del('react-query-cache');
    },
  };
}

// Fallback to localStorage persister
export function createLocalStoragePersister() {
  return {
    persistClient: async (client) => {
      try {
        localStorage.setItem('react-query-cache', JSON.stringify(client));
      } catch (error) {
        logger.error('Failed to persist to localStorage', 'QueryCache');
      }
    },
    restoreClient: async () => {
      try {
        const cached = localStorage.getItem('react-query-cache');
        return cached ? JSON.parse(cached) : undefined;
      } catch (error) {
        logger.error('Failed to restore from localStorage', 'QueryCache');
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        localStorage.removeItem('react-query-cache');
      } catch (error) {
        logger.error('Failed to remove from localStorage', 'QueryCache');
      }
    },
  };
}

// Setup persistence for the query client
export function setupPersistence(queryClient) {
  if (typeof window === 'undefined') return;

  try {
    // Try IndexedDB first (better for larger data)
    const persister = createIDBPersister();
    
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      buster: '', // Change this to clear cache on app updates
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist successful queries
          return query.state.status === 'success';
        },
      },
    });
  } catch (error) {
    logger.warn('IndexedDB not available, falling back to localStorage', 'QueryCache');
    
    // Fallback to localStorage
    try {
      const persister = createLocalStoragePersister();
      
      persistQueryClient({
        queryClient,
        persister,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        buster: '',
      });
    } catch (fallbackError) {
      logger.error('Failed to setup query persistence', 'QueryCache');
    }
  }
}
