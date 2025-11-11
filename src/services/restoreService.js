"use client";
import { set, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";

// Collection references for restore
const COLLECTION_REFS = {
  CUSTOMERS: "customers",
  TRANSACTIONS: "transactions",
  DAILY_CASH: "dailyCash",
  FABRIC_BATCHES: "fabricBatches",
  FABRICS: "fabrics",
  SUPPLIERS: "suppliers",
  SUPPLIER_TRANSACTIONS: "supplierTransactions",
  SETTINGS: "settings",
};

class RestoreService {
  /**
   * Restore data from backup file to Firebase
   */
  async restoreFromBackup(backupData, options = {}) {
    try {
      // console.log("Starting data restore...");

      const {
        dryRun = false,
        overwrite = false,
        collections = null, // null means restore all collections
      } = options;

      const results = {
        success: true,
        restored: {},
        errors: {},
        summary: {
          totalCollections: 0,
          totalRecords: 0,
          errors: 0,
        },
      };

      // Validate backup data structure
      if (!backupData.metadata || !backupData.collections) {
        throw new Error("Invalid backup file format");
      }

      // Determine which collections to restore
      const collectionsToRestore =
        collections || Object.keys(backupData.collections);

      for (const collectionName of collectionsToRestore) {
        try {
          // console.log(`Restoring ${collectionName}...`);

          const collectionData = backupData.collections[collectionName];
          if (!collectionData || !collectionData.data) {
            console.warn(`No data found for collection: ${collectionName}`);
            results.restored[collectionName] = {
              count: 0,
              status: "skipped",
              message: "No data found",
            };
            continue;
          }

          if (collectionData.error) {
            console.error(
              `Error in backup for ${collectionName}:`,
              collectionData.error
            );
            results.errors[collectionName] = collectionData.error;
            results.summary.errors++;
            continue;
          }

          // Get the Firebase path for this collection
          const firebasePath = COLLECTION_REFS[collectionName.toUpperCase()];
          if (!firebasePath) {
            console.warn(`Unknown collection: ${collectionName}`);
            results.restored[collectionName] = {
              count: 0,
              status: "skipped",
              message: "Unknown collection",
            };
            continue;
          }

          if (!dryRun) {
            // Restore data to Firebase
            const collectionRef = ref(db, firebasePath);

            if (overwrite) {
              // Replace all data
              await set(collectionRef, collectionData.data);
            } else {
              // Merge with existing data (Firebase will handle conflicts)
              const existingData = await this.getExistingData(firebasePath);
              const mergedData = {
                ...existingData,
                ...collectionData.data,
              };
              await set(collectionRef, mergedData);
            }
          }

          results.restored[collectionName] = {
            count: collectionData.count,
            status: dryRun ? "preview" : "restored",
            message: dryRun
              ? "Preview mode - no changes made"
              : "Successfully restored",
          };

          results.summary.totalCollections++;
          results.summary.totalRecords += collectionData.count;
        } catch (error) {
          console.error(`Error restoring ${collectionName}:`, error);
          results.errors[collectionName] = error.message;
          results.summary.errors++;
        }
      }

      results.summary.completedAt = new Date().toISOString();
      // console.log("Data restore completed:", results.summary);

      return results;
    } catch (error) {
      console.error("Error during data restore:", error);
      throw new Error(`Failed to restore data: ${error.message}`);
    }
  }

  /**
   * Get existing data from Firebase
   */
  async getExistingData(path) {
    try {
      const { get } = await import("firebase/database");
      const collectionRef = ref(db, path);
      const snapshot = await get(collectionRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error(`Error getting existing data from ${path}:`, error);
      return {};
    }
  }

  /**
   * Validate backup data before restore
   */
  validateBackupData(backupData) {
    const errors = [];
    const warnings = [];

    // Check metadata
    if (!backupData.metadata) {
      errors.push("Missing metadata in backup file");
    } else {
      if (!backupData.metadata.exportDate) {
        warnings.push("No export date found in metadata");
      }
      if (!backupData.metadata.version) {
        warnings.push("No version information found in metadata");
      }
    }

    // Check collections
    if (!backupData.collections || typeof backupData.collections !== "object") {
      errors.push("Invalid or missing collections data");
    } else {
      // Check each collection
      Object.entries(backupData.collections).forEach(([name, data]) => {
        if (!data) {
          errors.push(`Collection ${name} has no data`);
        } else {
          if (data.error) {
            warnings.push(`Collection ${name} has errors: ${data.error}`);
          }
          if (!data.data || typeof data.data !== "object") {
            errors.push(`Collection ${name} has invalid data format`);
          }
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get restore preview (dry run)
   */
  async getRestorePreview(backupData, collections = null) {
    try {
      const results = await this.restoreFromBackup(backupData, {
        dryRun: true,
        collections,
      });

      return {
        ...results,
        preview: true,
        message: "This is a preview. No data will be modified.",
      };
    } catch (error) {
      console.error("Error generating restore preview:", error);
      throw error;
    }
  }

  /**
   * Restore specific collections only
   */
  async restoreCollections(backupData, collectionNames, options = {}) {
    try {
      const results = await this.restoreFromBackup(backupData, {
        ...options,
        collections: collectionNames,
      });

      return results;
    } catch (error) {
      console.error("Error restoring specific collections:", error);
      throw error;
    }
  }

  /**
   * Create restore report
   */
  generateRestoreReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: results.summary,
      collections: results.restored,
      errors: results.errors,
      success: results.success,
    };

    // Generate text report
    let textReport = `RESTORE REPORT\n`;
    textReport += `Generated: ${formatDate(new Date())}\n`;
    textReport += `Status: ${results.success ? "SUCCESS" : "FAILED"}\n\n`;

    textReport += `SUMMARY:\n`;
    textReport += `- Collections: ${results.summary.totalCollections}\n`;
    textReport += `- Records: ${results.summary.totalRecords}\n`;
    textReport += `- Errors: ${results.summary.errors}\n\n`;

    if (Object.keys(results.restored).length > 0) {
      textReport += `RESTORED COLLECTIONS:\n`;
      Object.entries(results.restored).forEach(([name, data]) => {
        textReport += `- ${name}: ${data.count} records (${data.status})\n`;
      });
      textReport += `\n`;
    }

    if (Object.keys(results.errors).length > 0) {
      textReport += `ERRORS:\n`;
      Object.entries(results.errors).forEach(([name, error]) => {
        textReport += `- ${name}: ${error}\n`;
      });
    }

    return {
      json: report,
      text: textReport,
    };
  }

  /**
   * Download restore report
   */
  downloadRestoreReport(results) {
    try {
      const report = this.generateRestoreReport(results);

      // Create and download JSON report
      const jsonBlob = new Blob([JSON.stringify(report.json, null, 2)], {
        type: "application/json",
      });
      const jsonUrl = URL.createObjectURL(jsonBlob);

      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.download = `restore-report-${formatDate(
        new Date(),
        "YYYY-MM-DD-HH-mm-ss"
      )}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      // Create and download text report
      const textBlob = new Blob([report.text], { type: "text/plain" });
      const textUrl = URL.createObjectURL(textBlob);

      const textLink = document.createElement("a");
      textLink.href = textUrl;
      textLink.download = `restore-report-${formatDate(
        new Date(),
        "YYYY-MM-DD-HH-mm-ss"
      )}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);

      return {
        success: true,
        message: "Restore report downloaded successfully",
      };
    } catch (error) {
      console.error("Error downloading restore report:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const restoreService = new RestoreService();
export default restoreService;
