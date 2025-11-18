"use client";

import { ref, get, set, update, remove } from "firebase/database";
import { db } from "@/lib/firebase";

/**
 * Database Migration Utility
 *
 * This utility migrates from the old fabric structure (separate fabricBatches collection)
 * to the new flattened structure (batches nested within fabrics)
 */

const COLLECTION_REFS = {
  FABRICS: "fabrics",
  FABRIC_BATCHES: "fabricBatches",
};

export class DatabaseMigration {
  constructor() {
    this.migrationLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.migrationLog.push(logEntry);
    // Logging handled by migration log array - view in migration results
  }

  async migrateToFlattenedStructure() {
    this.log("Starting database migration to flattened structure...");

    try {
      // Step 1: Get all fabrics and batches
      const fabricsRef = ref(db, COLLECTION_REFS.FABRICS);
      const batchesRef = ref(db, COLLECTION_REFS.FABRIC_BATCHES);

      const [fabricsSnapshot, batchesSnapshot] = await Promise.all([
        get(fabricsRef),
        get(batchesRef),
      ]);

      if (!fabricsSnapshot.exists()) {
        this.log("No fabrics found to migrate");
        return { success: true, message: "No fabrics to migrate" };
      }

      const fabrics = fabricsSnapshot.val();
      const batches = batchesSnapshot.exists() ? batchesSnapshot.val() : {};

      this.log(
        `Found ${Object.keys(fabrics).length} fabrics and ${
          Object.keys(batches).length
        } batches`
      );

      // Step 2: Create backup of current data
      const backupData = {
        fabrics: { ...fabrics },
        fabricBatches: { ...batches },
        migratedAt: new Date().toISOString(),
      };

      // Step 3: Migrate each fabric
      const migrationPromises = Object.entries(fabrics).map(
        async ([fabricId, fabricData]) => {
          try {
            // Find batches for this fabric
            const fabricBatches = Object.entries(batches)
              .filter(([_, batch]) => batch.fabricId === fabricId)
              .map(([batchId, batchData]) => ({
                [batchId]: {
                  ...batchData,
                  // Ensure items array exists
                  items: batchData.items || [],
                },
              }))
              .reduce((acc, batch) => ({ ...acc, ...batch }), {});

            // Update fabric with nested batches
            const updatedFabric = {
              ...fabricData,
              batches: fabricBatches,
              migratedAt: new Date().toISOString(),
            };

            await update(
              ref(db, `${COLLECTION_REFS.FABRICS}/${fabricId}`),
              updatedFabric
            );

            this.log(`Migrated fabric: ${fabricData.name || fabricId}`);
            return { fabricId, success: true };
          } catch (error) {
            this.log(`Error migrating fabric ${fabricId}: ${error.message}`);
            return { fabricId, success: false, error: error.message };
          }
        }
      );

      const results = await Promise.all(migrationPromises);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      this.log(
        `Migration completed: ${successful} successful, ${failed} failed`
      );

      // Step 4: Remove old fabricBatches collection if migration was successful
      if (failed === 0) {
        this.log("Removing old fabricBatches collection...");
        await remove(batchesRef);
        this.log("Old fabricBatches collection removed");
      } else {
        this.log(
          "Keeping old fabricBatches collection due to migration failures"
        );
      }

      // Step 5: Save migration log
      const migrationResult = {
        timestamp: new Date().toISOString(),
        fabricsMigrated: successful,
        fabricsFailed: failed,
        log: this.migrationLog,
        backupData: failed > 0 ? backupData : null, // Only keep backup if there were failures
      };

      // Save migration result to database
      await set(
        ref(db, "migrationResults/flattenedStructure"),
        migrationResult
      );

      return {
        success: failed === 0,
        message: `Migration completed: ${successful} successful, ${failed} failed`,
        details: migrationResult,
      };
    } catch (error) {
      this.log(`Migration failed: ${error.message}`);
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        details: { log: this.migrationLog },
      };
    }
  }

  async rollbackMigration() {
    this.log("Starting migration rollback...");

    try {
      // Get migration result to find backup data
      const migrationResultRef = ref(db, "migrationResults/flattenedStructure");
      const migrationResultSnapshot = await get(migrationResultRef);

      if (!migrationResultSnapshot.exists()) {
        throw new Error("No migration result found - cannot rollback");
      }

      const migrationResult = migrationResultSnapshot.val();

      if (!migrationResult.backupData) {
        throw new Error("No backup data found - cannot rollback");
      }

      // Restore fabrics
      const fabricsRef = ref(db, COLLECTION_REFS.FABRICS);
      await set(fabricsRef, migrationResult.backupData.fabrics);

      // Restore fabricBatches if they existed
      if (migrationResult.backupData.fabricBatches) {
        const batchesRef = ref(db, COLLECTION_REFS.FABRIC_BATCHES);
        await set(batchesRef, migrationResult.backupData.fabricBatches);
      }

      // Remove migration result
      await remove(migrationResultRef);

      this.log("Rollback completed successfully");
      return {
        success: true,
        message: "Rollback completed successfully",
      };
    } catch (error) {
      this.log(`Rollback failed: ${error.message}`);
      return {
        success: false,
        message: `Rollback failed: ${error.message}`,
      };
    }
  }

  async checkMigrationStatus() {
    try {
      const migrationResultRef = ref(db, "migrationResults/flattenedStructure");
      const migrationResultSnapshot = await get(migrationResultRef);

      if (migrationResultSnapshot.exists()) {
        const result = migrationResultSnapshot.val();
        return {
          migrated: true,
          timestamp: result.timestamp,
          success: result.fabricsFailed === 0,
          details: result,
        };
      }

      // Check if we have any fabrics with the new structure
      const fabricsRef = ref(db, COLLECTION_REFS.FABRICS);
      const fabricsSnapshot = await get(fabricsRef);

      if (!fabricsSnapshot.exists()) {
        return { migrated: false, status: "no_data" };
      }

      const fabrics = fabricsSnapshot.val();
      const sampleFabric = Object.values(fabrics)[0];

      // Check if fabric has batches property (new structure)
      const hasNewStructure =
        sampleFabric && sampleFabric.batches !== undefined;

      return {
        migrated: hasNewStructure,
        status: hasNewStructure ? "new_structure" : "old_structure",
        sampleFabric: hasNewStructure ? null : sampleFabric, // Don't expose full fabric data
      };
    } catch (error) {
      return {
        migrated: false,
        status: "error",
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export const databaseMigration = new DatabaseMigration();

// Export utility functions for easy use
export const migrateDatabase = () =>
  databaseMigration.migrateToFlattenedStructure();
export const rollbackMigration = () => databaseMigration.rollbackMigration();
export const checkMigrationStatus = () =>
  databaseMigration.checkMigrationStatus();
