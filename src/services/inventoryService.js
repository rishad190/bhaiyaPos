import {
  ref,
  get,
  push,
  set,
  remove,
  update,
} from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";
import { COLLECTIONS, snapshotToArray } from "./utils";

export const fabricService = {
  // Fetch paginated fabrics
  async getFabrics({ page = 1, limit = 20, searchTerm = "" } = {}) {
    try {
      const fabricsRef = ref(db, COLLECTIONS.FABRICS);
      const snapshot = await get(fabricsRef);
      
      let fabrics = snapshotToArray(snapshot).map((fabric) => {
        // Remove the 'id' field from the fabric data if it exists (it shouldn't be stored in the data)
        const { id: storedId, ...fabricData } = fabric;
        
        return {
          ...fabricData,
          id: fabric.id, // Use the Firebase key as the ID
          batches: fabricData.batches
            ? Object.entries(fabricData.batches).map(([batchId, batch]) => ({
                id: batchId,
                ...batch,
              }))
            : [],
        };
      });
      
      logger.info('[fabricService] Total fabrics fetched:', fabrics.length);
      if (fabrics.length > 0) {
        logger.info('[fabricService] Sample fabric:', fabrics[0]);
      }
      
      // Apply search filter
      if (searchTerm) {
        fabrics = fabrics.filter((f) =>
          f.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedFabrics = fabrics.slice(startIndex, endIndex);
      
      return {
        data: paginatedFabrics,
        total: fabrics.length,
        page,
        limit,
        totalPages: Math.ceil(fabrics.length / limit),
      };
    } catch (error) {
      logger.error("[fabricService] Error fetching fabrics:", error);
      throw error;
    }
  },

  // Add fabric
  async addFabric(fabricData) {
    try {
      const fabricsRef = ref(db, COLLECTIONS.FABRICS);
      const newFabricRef = push(fabricsRef);
      
      // Remove 'id' field if it exists - Firebase key is the ID
      const { id, ...dataWithoutId } = fabricData;
      
      const fabricToSave = {
        ...dataWithoutId,
        batches: dataWithoutId.batches || {},
        createdAt: new Date().toISOString(),
      };
      
      logger.info('[fabricService] Adding fabric:', fabricToSave);
      await set(newFabricRef, fabricToSave);
      
      logger.info('[fabricService] Fabric added with ID:', newFabricRef.key);
      return newFabricRef.key;
    } catch (error) {
      logger.error("[fabricService] Error adding fabric:", error);
      throw error;
    }
  },

  // Update fabric
  async updateFabric(fabricId, updatedData) {
    try {
      // Remove 'id' field if it exists - Firebase key is the ID
      const { id, ...dataWithoutId } = updatedData;
      
      const fabricRef = ref(db, `${COLLECTIONS.FABRICS}/${fabricId}`);
      await update(fabricRef, {
        ...dataWithoutId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("[fabricService] Error updating fabric:", error);
      throw error;
    }
  },

  // Delete fabric
  async deleteFabric(fabricId) {
    try {
      await remove(ref(db, `${COLLECTIONS.FABRICS}/${fabricId}`));
    } catch (error) {
      logger.error("[fabricService] Error deleting fabric:", error);
      throw error;
    }
  },
};
