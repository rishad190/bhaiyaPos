"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { settingsService } from '@/services/settingsService';
import logger from "@/utils/logger";

// Default settings structure
const DEFAULT_SETTINGS = {
  store: {
    storeName: "",
    address: "",
    phone: "",
    email: "",
    currency: "৳",
    logo: "/download.png",
  },
  notifications: {
    lowStockAlert: true,
    duePaymentAlert: true,
    newOrderAlert: true,
    emailNotifications: false,
  },
  appearance: {
    theme: "light",
    compactMode: false,
    showImages: true,
  },
  security: {
    requirePassword: false,
    sessionTimeout: 30,
    backupEnabled: true,
  },
};

// Fetch settings
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const data = await settingsService.getSettings();
        
        if (data) {
          // Merge with defaults to ensure all fields exist
          return {
            store: { ...DEFAULT_SETTINGS.store, ...(data.store || {}) },
            notifications: { ...DEFAULT_SETTINGS.notifications, ...(data.notifications || {}) },
            appearance: { ...DEFAULT_SETTINGS.appearance, ...(data.appearance || {}) },
            security: { ...DEFAULT_SETTINGS.security, ...(data.security || {}) },
          };
        }
        
        return DEFAULT_SETTINGS;
      } catch (error) {
        logger.error(`Failed to fetch settings: ${error.message}`, "Settings");
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    // Provide initial data to prevent undefined errors
    placeholderData: DEFAULT_SETTINGS,
  });
}

// Update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSettings) => {
      try {
        await settingsService.updateSettings(newSettings);
        return newSettings;
      } catch (error) {
        logger.error(`Failed to update settings: ${error.message}`, "Settings");
        throw error;
      }
    },
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["settings"] });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(["settings"]);

      // Optimistically update
      queryClient.setQueryData(["settings"], (old) => ({
        ...old,
        ...newSettings,
      }));

      return { previousSettings };
    },
    onError: (error, newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(["settings"], context.previousSettings);
      }
      logger.error(`Settings update failed: ${error.message}`, "Settings");
    },
    onSuccess: () => {
      logger.info("Settings updated successfully", "Settings");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
