import {
  ref,
  get,
  update,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";
import { COLLECTIONS } from "./utils";

export const settingsService = {
  // Get settings
  async getSettings() {
    try {
      const settingsRef = ref(db, COLLECTIONS.SETTINGS);
      const snapshot = await get(settingsRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      logger.error("[settingsService] Error fetching settings:", error);
      throw error;
    }
  },

  // Update settings
  async updateSettings(newSettings) {
    try {
      await update(ref(db, COLLECTIONS.SETTINGS), newSettings);
    } catch (error) {
      logger.error("[settingsService] Error updating settings:", error);
      throw error;
    }
  },
};
