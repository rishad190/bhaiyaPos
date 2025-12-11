"use client";
import { backupService } from "./backupService";
import logger from "@/utils/logger";

class BackupScheduler {
  constructor() {
    this.scheduledBackups = new Map();
    this.isRunning = false;
    this.defaultSettings = {
      enabled: false,
      frequency: "daily", // daily, weekly, monthly
      time: "02:00", // 24-hour format
      format: "json", // json, csv, compressed
      retention: 30, // days to keep backups
      autoCleanup: true,
    };
  }

  /**
   * Initialize the backup scheduler
   */
  async initialize() {
    try {
      // Load settings from localStorage
      const settings = this.loadSettings();

      if (settings.enabled) {
        await this.startScheduler(settings);
      }


    } catch (error) {
      logger.error("Error initializing backup scheduler:", error);
    }
  }

  /**
   * Start the backup scheduler
   */
  async startScheduler(settings = null) {
    try {
      const config = settings || this.loadSettings();

      if (this.isRunning) {

        return;
      }

      this.isRunning = true;


      // Schedule the backup
      await this.scheduleBackup(config);
    } catch (error) {
      logger.error("Error starting backup scheduler:", error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the backup scheduler
   */
  stopScheduler() {
    try {
      // Clear all scheduled backups
      this.scheduledBackups.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      this.scheduledBackups.clear();

      this.isRunning = false;

    } catch (error) {
      logger.error("Error stopping backup scheduler:", error);
    }
  }

  /**
   * Schedule a backup based on frequency
   */
  async scheduleBackup(config) {
    try {
      const nextRunTime = this.calculateNextRunTime(config);
      const delay = nextRunTime.getTime() - Date.now();



      const timeoutId = setTimeout(async () => {
        try {
          await this.executeScheduledBackup(config);

          // Schedule the next backup
          if (this.isRunning) {
            await this.scheduleBackup(config);
          }
        } catch (error) {
          logger.error("Error executing scheduled backup:", error);
        }
      }, delay);

      this.scheduledBackups.set("main", timeoutId);
    } catch (error) {
      logger.error("Error scheduling backup:", error);
    }
  }

  /**
   * Calculate the next run time based on frequency and time
   */
  calculateNextRunTime(config) {
    const now = new Date();
    const [hours, minutes] = config.time.split(":").map(Number);

    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (config.frequency) {
      case "daily":
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case "weekly":
        // Find next occurrence of the same day of week
        const targetDay = nextRun.getDay();
        const currentDay = now.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;

        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        break;

      case "monthly":
        // First day of next month at specified time
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
        break;

      default:
        // Default to daily
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
    }

    return nextRun;
  }

  /**
   * Execute a scheduled backup
   */
  async executeScheduledBackup(config) {
    try {


      let result;
      switch (config.format) {
        case "json":
          result = await backupService.exportToJSON();
          break;
        case "csv":
          result = await backupService.exportToCSV();
          break;
        case "compressed":
          result = await backupService.createCompressedBackup();
          break;
        default:
          result = await backupService.exportToJSON();
      }

      // Log backup completion
      const backupLog = {
        timestamp: new Date().toISOString(),
        format: config.format,
        filename: result.filename || "Multiple files",
        recordCount: result.recordCount || 0,
        success: true,
      };

      this.logBackup(backupLog);

      // Cleanup old backups if enabled
      if (config.autoCleanup) {
        await this.cleanupOldBackups(config.retention);
      }


      return result;
    } catch (error) {
      logger.error("Error executing scheduled backup:", error);

      // Log backup failure
      const backupLog = {
        timestamp: new Date().toISOString(),
        format: config.format,
        error: error.message,
        success: false,
      };

      this.logBackup(backupLog);
      throw error;
    }
  }

  /**
   * Log backup execution
   */
  logBackup(backupLog) {
    try {
      const logs = this.getBackupLogs();
      logs.push(backupLog);

      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem("backupLogs", JSON.stringify(logs));
    } catch (error) {
      logger.error("Error logging backup:", error);
    }
  }

  /**
   * Get backup logs
   */
  getBackupLogs() {
    try {
      const logs = localStorage.getItem("backupLogs");
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      logger.error("Error getting backup logs:", error);
      return [];
    }
  }

  /**
   * Cleanup old backup files (simulation - in real app, would delete actual files)
   */
  async cleanupOldBackups(retentionDays) {
    try {
      const logs = this.getBackupLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const recentLogs = logs.filter(
        (log) => new Date(log.timestamp) > cutoffDate
      );

      localStorage.setItem("backupLogs", JSON.stringify(recentLogs));

    } catch (error) {
      logger.error("Error cleaning up old backups:", error);
    }
  }

  /**
   * Save backup settings
   */
  saveSettings(settings) {
    try {
      const config = { ...this.defaultSettings, ...settings };
      localStorage.setItem("backupSettings", JSON.stringify(config));

    } catch (error) {
      logger.error("Error saving backup settings:", error);
    }
  }

  /**
   * Load backup settings
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem("backupSettings");
      return settings ? JSON.parse(settings) : this.defaultSettings;
    } catch (error) {
      logger.error("Error loading backup settings:", error);
      return this.defaultSettings;
    }
  }

  /**
   * Update backup settings and restart scheduler
   */
  async updateSettings(newSettings) {
    try {
      this.saveSettings(newSettings);

      if (this.isRunning) {
        this.stopScheduler();
      }

      if (newSettings.enabled) {
        await this.startScheduler(newSettings);
      }
    } catch (error) {
      logger.error("Error updating backup settings:", error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      settings: this.loadSettings(),
      nextRunTime: this.isRunning
        ? this.calculateNextRunTime(this.loadSettings())
        : null,
      logs: this.getBackupLogs().slice(-10), // Last 10 logs
    };
  }

  /**
   * Execute immediate backup
   */
  async executeImmediateBackup(format = "json") {
    try {


      let result;
      switch (format) {
        case "json":
          result = await backupService.exportToJSON();
          break;
        case "csv":
          result = await backupService.exportToCSV();
          break;
        case "compressed":
          result = await backupService.createCompressedBackup();
          break;
        default:
          result = await backupService.exportToJSON();
      }

      // Log the backup
      this.logBackup({
        timestamp: new Date().toISOString(),
        format,
        filename: result.filename || "Multiple files",
        recordCount: result.recordCount || 0,
        success: true,
        immediate: true,
      });

      return result;
    } catch (error) {
      logger.error("Error executing immediate backup:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const backupScheduler = new BackupScheduler();
export default backupScheduler;
