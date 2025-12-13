"use client";
import { useState } from "react";
import { useOnlineStatus } from "./OfflineIndicator";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, RefreshCw, Database } from "lucide-react";
import logger from "@/utils/logger";

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheInfo, setCacheInfo] = useState(null);
  const isOnline = useOnlineStatus();

  if (process.env.NODE_ENV === 'production') return null;

  const getCacheInfo = async () => {
    try {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      setCacheInfo({
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.state.status === 'success').length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
        loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      });
    } catch (error) {
      logger.error('Failed to get cache info', error);
    }
  };

  const clearCache = async () => {
    if (confirm('Clear all cached data? This will reload the page.')) {
      try {
        // Clear React Query cache
        queryClient.clear();
        
        // Clear IndexedDB
        const dbs = await indexedDB.databases();
        dbs.forEach(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
        
        // Clear localStorage
        localStorage.clear();
        
        // Reload
        window.location.reload();
      } catch (error) {
        logger.error('Failed to clear cache', error);
        alert('Failed to clear cache. Check console for details.');
      }
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries();
    alert('All queries invalidated. Data will refetch.');
  };

  const simulateOffline = () => {
    alert('To simulate offline:\n1. Open DevTools (F12)\n2. Network tab\n3. Set to "Offline"');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700"
        title="Dev Tools"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border rounded-lg shadow-xl p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Dev Tools</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="p-2 bg-gray-50 rounded">
          <div className="text-sm">
            <strong>Status:</strong>{" "}
            <span className={isOnline ? "text-green-600" : "text-orange-600"}>
              {isOnline ? "🟢 Online" : "🔴 Offline"}
            </span>
          </div>
        </div>

        {/* Cache Info */}
        {cacheInfo && (
          <div className="p-2 bg-gray-50 rounded text-sm">
            <div><strong>Total Queries:</strong> {cacheInfo.totalQueries}</div>
            <div><strong>Active:</strong> {cacheInfo.activeQueries}</div>
            <div><strong>Loading:</strong> {cacheInfo.loadingQueries}</div>
            <div><strong>Errors:</strong> {cacheInfo.errorQueries}</div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={getCacheInfo}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Database className="h-4 w-4 mr-2" />
            Get Cache Info
          </Button>

          <Button
            onClick={invalidateAll}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Invalidate All Queries
          </Button>

          <Button
            onClick={simulateOffline}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="h-4 w-4 mr-2" />
            Simulate Offline
          </Button>

          <Button
            onClick={clearCache}
            variant="destructive"
            size="sm"
            className="w-full justify-start"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Cache
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Dev tools only visible in development
        </div>
      </div>
    </div>
  );
}
