/**
 * Database Migration Utility for Flattened Fabric Structure
 *
 * This utility helps migrate from the current nested structure to the recommended flattened structure
 * for better performance and querying.
 */

import { ref, get, set, update, remove } from "firebase/database";
import { db } from "./firebase";

// Collection references
const COLLECTION_REFS = {
  FABRICS: "fabrics",
  FABRIC_BATCHES: "fabricBatches",
};

/**
 * Current Structure (to be migrated):
 * "fabrics": [
 *   {
 *     id: "fabric1",
 *     name: "Cotton Fabric",
 *     batches: [
 *       {
 *         id: "batch1",
 *         fabricId: "fabric1",
 *         items: [...]
 *       }
 *     ]
 *   }
 * ],
 * "fabricBatches": [
 *   {
 *     id: "batch1",
 *     fabricId: "fabric1",
 *     items: [...]
 *   }
 * ]
 *
 * New Flattened Structure:
 * "fabrics": {
 *   "fabricId": {
 *     "name": "Cotton Fabric",
 *     "category": "Cotton",
 *     "unit": "meter",
 *     "batches": {
 *       "batchId": {
 *         "batchNumber": "BATCH001",
 *         "purchaseDate": "2024-01-15",
 *         "containerNo": "CTN123",
 *         "costPerPiece": 150,
 *         "items": [
 *           { "colorName": "Red", "quantity": 100 },
 *           { "colorName": "Blue", "quantity": 150 }
 *         ]
 *       }
 *     }
 *   }
 * }
 */

/**
 * Migrates all existing data to the new flattened structure
 */
export const migrateToFlattenedStructure = async () => {
  console.log(
    "[Migration] Starting database migration to flattened structure..."
  );

  try {
    // Get current fabrics and batches
    const fabricsRef = ref(db, COLLECTION_REFS.FABRICS);
    const batchesRef = ref(db, COLLECTION_REFS.FABRIC_BATCHES);

    const [fabricsSnapshot, batchesSnapshot] = await Promise.all([
      get(fabricsRef),
      get(batchesRef),
    ]);

    if (!fabricsSnapshot.exists()) {
      console.log("[Migration] No fabrics found to migrate");
      return { success: true, migrated: 0 };
    }

    const currentFabrics = fabricsSnapshot.val();
    const currentBatches = batchesSnapshot.exists()
      ? batchesSnapshot.val()
      : {};

    console.log(
      `[Migration] Found ${Object.keys(currentFabrics).length} fabrics and ${
        Object.keys(currentBatches).length
      } batches`
    );

    // Create new flattened structure
    const flattenedFabrics = {};
    let migratedCount = 0;

    // Process each fabric
    for (const [fabricId, fabricData] of Object.entries(currentFabrics)) {
      if (!fabricData) continue;

      // Create flattened fabric structure
      flattenedFabrics[fabricId] = {
        name: fabricData.name || "",
        code: fabricData.code || "",
        category: fabricData.category || "",
        unit: fabricData.unit || "piece",
        description: fabricData.description || "",
        lowStockThreshold: fabricData.lowStockThreshold || 20,
        batches: {},
        createdAt: fabricData.createdAt || new Date().toISOString(),
        updatedAt: fabricData.updatedAt || new Date().toISOString(),
      };

      // Find and attach batches for this fabric
      const fabricBatches = Object.entries(currentBatches)
        .filter(([_, batch]) => batch && batch.fabricId === fabricId)
        .map(([batchId, batch]) => ({ batchId, ...batch }));

      for (const batch of fabricBatches) {
        flattenedFabrics[fabricId].batches[batch.batchId] = {
          batchNumber: batch.batchNumber || batch.id,
          purchaseDate: batch.purchaseDate || batch.createdAt,
          containerNo: batch.containerNo || "",
          costPerPiece: batch.costPerPiece || batch.unitCost || 0,
          items: Array.isArray(batch.items) ? batch.items : [],
          supplierId: batch.supplierId || "",
          createdAt: batch.createdAt || new Date().toISOString(),
          updatedAt: batch.updatedAt || new Date().toISOString(),
        };
      }

      migratedCount++;
      console.log(
        `[Migration] Processed fabric: ${fabricData.name} with ${fabricBatches.length} batches`
      );
    }

    // Save flattened structure to a new path temporarily
    const flattenedRef = ref(db, "fabrics_flattened");
    await set(flattenedRef, flattenedFabrics);

    console.log(
      `[Migration] Successfully migrated ${migratedCount} fabrics to flattened structure`
    );
    console.log(
      "[Migration] New structure saved to 'fabrics_flattened' for verification"
    );

    return {
      success: true,
      migrated: migratedCount,
      backupPath: "fabrics_flattened",
    };
  } catch (error) {
    console.error("[Migration] Error during migration:", error);
    throw new Error(`Migration failed: ${error.message}`);
  }
};

/**
 * Verifies the migration was successful
 */
export const verifyMigration = async () => {
  try {
    const flattenedRef = ref(db, "fabrics_flattened");
    const snapshot = await get(flattenedRef);

    if (!snapshot.exists()) {
      return { success: false, error: "No flattened data found" };
    }

    const flattenedData = snapshot.val();
    const fabricCount = Object.keys(flattenedData).length;
    let totalBatches = 0;

    for (const fabric of Object.values(flattenedData)) {
      if (fabric.batches) {
        totalBatches += Object.keys(fabric.batches).length;
      }
    }

    return {
      success: true,
      fabricCount,
      batchCount: totalBatches,
      sample: Object.values(flattenedData)[0], // Return first fabric as sample
    };
  } catch (error) {
    console.error("[Migration] Verification error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Finalizes migration by replacing the old structure with the new one
 */
export const finalizeMigration = async () => {
  try {
    console.log("[Migration] Finalizing migration...");

    // Get the flattened data
    const flattenedRef = ref(db, "fabrics_flattened");
    const snapshot = await get(flattenedRef);

    if (!snapshot.exists()) {
      throw new Error("No flattened data found to finalize");
    }

    const flattenedData = snapshot.val();

    // Replace the old fabrics structure with the new one
    const fabricsRef = ref(db, COLLECTION_REFS.FABRICS);
    await set(fabricsRef, flattenedData);

    // Remove old batches collection
    const batchesRef = ref(db, COLLECTION_REFS.FABRIC_BATCHES);
    await remove(batchesRef);

    // Remove temporary flattened data
    await remove(flattenedRef);

    console.log("[Migration] Migration finalized successfully");
    return { success: true };
  } catch (error) {
    console.error("[Migration] Finalization error:", error);
    throw new Error(`Finalization failed: ${error.message}`);
  }
};

/**
 * Rolls back migration in case of issues
 */
export const rollbackMigration = async () => {
  try {
    console.log("[Migration] Rolling back migration...");

    // Remove temporary flattened data
    const flattenedRef = ref(db, "fabrics_flattened");
    await remove(flattenedRef);

    console.log("[Migration] Rollback completed");
    return { success: true };
  } catch (error) {
    console.error("[Migration] Rollback error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Migration status check
 */
export const getMigrationStatus = async () => {
  try {
    const [fabricsSnapshot, batchesSnapshot, flattenedSnapshot] =
      await Promise.all([
        get(ref(db, COLLECTION_REFS.FABRICS)),
        get(ref(db, COLLECTION_REFS.FABRIC_BATCHES)),
        get(ref(db, "fabrics_flattened")),
      ]);

    const hasOldFabrics = fabricsSnapshot.exists();
    const hasOldBatches = batchesSnapshot.exists();
    const hasFlattened = flattenedSnapshot.exists();

    return {
      oldStructure: {
        fabrics: hasOldFabrics,
        batches: hasOldBatches,
      },
      flattenedStructure: hasFlattened,
      migrationInProgress: hasFlattened,
      migrationComplete: hasOldFabrics && !hasOldBatches && !hasFlattened,
    };
  } catch (error) {
    console.error("[Migration] Status check error:", error);
    return { error: error.message };
  }
};

export default {
  migrateToFlattenedStructure,
  verifyMigration,
  finalizeMigration,
  rollbackMigration,
  getMigrationStatus,
};
