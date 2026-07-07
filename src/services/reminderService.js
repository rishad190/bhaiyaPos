import {
  ref,
  get,
  push,
  set,
  remove,
  update,
  serverTimestamp,
  onValue,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";
import { COLLECTIONS, snapshotToArray, snapshotToObject } from "./utils";

// ============ REMINDERS ============
export const reminderService = {
  // Fetch all reminders
  async getReminders() {
    try {
      const remindersRef = ref(db, COLLECTIONS.REMINDERS);
      const snapshot = await get(remindersRef);
      return snapshotToArray(snapshot);
    } catch (error) {
      logger.error("[reminderService] Error fetching reminders:", error);
      throw error;
    }
  },

  // Get single reminder
  async getReminder(reminderId) {
    try {
      const reminderRef = ref(db, `${COLLECTIONS.REMINDERS}/${reminderId}`);
      const snapshot = await get(reminderRef);
      return snapshotToObject(snapshot);
    } catch (error) {
      logger.error("[reminderService] Error fetching reminder:", error);
      throw error;
    }
  },

  // Add reminder
  async addReminder(reminderData) {
    try {
      const remindersRef = ref(db, COLLECTIONS.REMINDERS);
      const newReminderRef = push(remindersRef);
      await set(newReminderRef, {
        ...reminderData,
        createdAt: new Date().toISOString(),
        status: reminderData.status || "pending",
        notified: reminderData.notified || false,
      });
      return newReminderRef.key;
    } catch (error) {
      logger.error("[reminderService] Error adding reminder:", error);
      throw error;
    }
  },

  // Update reminder
  async updateReminder(reminderId, updatedData) {
    try {
      const reminderRef = ref(db, `${COLLECTIONS.REMINDERS}/${reminderId}`);
      await update(reminderRef, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("[reminderService] Error updating reminder:", error);
      throw error;
    }
  },

  // Delete reminder
  async deleteReminder(reminderId) {
    try {
      await remove(ref(db, `${COLLECTIONS.REMINDERS}/${reminderId}`));
    } catch (error) {
      logger.error("[reminderService] Error deleting reminder:", error);
      throw error;
    }
  },

  // Subscribe to reminders updates (real-time)
  subscribeToReminders(callback) {
    const remindersRef = ref(db, COLLECTIONS.REMINDERS);
    const unsubscribe = onValue(remindersRef, (snapshot) => {
      const reminders = snapshotToArray(snapshot);
      callback(reminders);
    });
    return unsubscribe;
  },
};
