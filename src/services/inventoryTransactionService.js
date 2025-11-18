import { ref, runTransaction, get } from "firebase/database";
import { db } from "@/lib/firebase";
import logger from "@/utils/logger";

/**
 * Safely reduce inventory using Firebase transactions to prevent race conditions
 * This ensures atomic read-modify-write operations that prevent overselling
 */
export const inventoryTransactionService = {
  /**
   * Reduce inventory for multiple products using Firebase transactions
   * @param {Array} saleProducts - Array of products to reduce inventory for
   * @returns {Promise} - Resolves when all inventory is reduced successfully
   */
  async reduceInventoryAtomic(saleProducts) {
    logger.info("[InventoryTransaction] Starting atomic inventory reduction", {
      productCount: saleProducts.length,
    });

    // Validate input
    if (!Array.isArray(saleProducts) || saleProducts.length === 0) {
      throw new Error("No products provided for inventory reduction");
    }

    const results = [];

    // Process each product
    for (const product of saleProducts) {
      logger.info(`[InventoryTransaction] Processing product: ${product.name}`, {
        fabricId: product.fabricId,
        quantity: product.quantity,
        color: product.color,
      });

      // Validate product data
      if (!product.fabricId) {
        throw new Error(
          `Product "${product.name}" has no fabric ID. Please select a valid product.`
        );
      }

      if (!product.quantity || product.quantity <= 0) {
        throw new Error(`Invalid quantity for product "${product.name}"`);
      }

      // Use Firebase transaction for atomic read-modify-write
      const fabricRef = ref(db, `fabrics/${product.fabricId}`);

      try {
        const result = await runTransaction(fabricRef, (currentFabric) => {
          // If fabric doesn't exist, abort transaction
          if (!currentFabric) {
            logger.error(`[InventoryTransaction] Fabric not found: ${product.fabricId}`);
            return; // Abort transaction
          }

          // Check if fabric has batches
          if (!currentFabric.batches || Object.keys(currentFabric.batches).length === 0) {
            logger.error(`[InventoryTransaction] No batches for fabric: ${product.name}`);
            return; // Abort transaction
          }

          // Sort batches by purchase date (FIFO)
          const sortedBatches = Object.entries(currentFabric.batches)
            .map(([batchId, batch]) => ({ batchId, ...batch }))
            .sort(
              (a, b) =>
                new Date(a.purchaseDate || a.createdAt) -
                new Date(b.purchaseDate || b.createdAt)
            );

          let remainingQuantity = product.quantity;
          const batchesModified = [];

          // Try to reduce inventory from batches (FIFO)
          for (const batch of sortedBatches) {
            if (remainingQuantity <= 0) break;

            if (!batch.items || !Array.isArray(batch.items)) {
              logger.warn(`[InventoryTransaction] Batch ${batch.batchId} has no items`);
              continue;
            }

            // Find items that match the color (if specified) or any item if no color
            const eligibleItems = batch.items.filter((item) => {
              if (product.color) {
                return (
                  item.colorName === product.color && (item.quantity || 0) > 0
                );
              }
              return (item.quantity || 0) > 0;
            });

            for (const item of eligibleItems) {
              if (remainingQuantity <= 0) break;

              const availableQuantity = item.quantity || 0;
              const quantityToReduce = Math.min(
                availableQuantity,
                remainingQuantity
              );

              if (quantityToReduce > 0) {
                // Update the item quantity
                item.quantity = availableQuantity - quantityToReduce;
                remainingQuantity -= quantityToReduce;

                logger.info(
                  `[InventoryTransaction] Reducing ${quantityToReduce} from batch ${batch.batchId}`,
                  {
                    color: item.colorName || "no color",
                    newQuantity: item.quantity,
                  }
                );
              }
            }

            // Update the batch in the fabric data
            currentFabric.batches[batch.batchId] = {
              ...batch,
              items: batch.items,
            };

            batchesModified.push(batch.batchId);
          }

          // Check if we have enough stock
          if (remainingQuantity > 0) {
            logger.error(
              `[InventoryTransaction] Insufficient stock for ${product.name}`,
              {
                requested: product.quantity,
                available: product.quantity - remainingQuantity,
                remaining: remainingQuantity,
              }
            );
            return; // Abort transaction - insufficient stock
          }

          // Return the modified fabric data to commit the transaction
          logger.info(
            `[InventoryTransaction] Successfully reduced inventory for ${product.name}`,
            {
              batchesModified: batchesModified.length,
            }
          );

          return currentFabric;
        });

        // Check if transaction was committed
        if (!result.committed) {
          // Transaction was aborted
          const fabricSnapshot = await get(fabricRef);
          
          if (!fabricSnapshot.exists()) {

            throw new Error(
              `Fabric "${product.name}" (ID: ${product.fabricId}) not found in database`
            );
          }

          const fabricData = fabricSnapshot.val();
          if (!fabricData.batches || Object.keys(fabricData.batches).length === 0) {
            throw new Error(
              `No batches found for fabric "${product.name}". Please purchase stock for this fabric first.`
            );
          }

          // Calculate available stock
          let availableStock = 0;
          Object.values(fabricData.batches).forEach((batch) => {
            if (batch.items && Array.isArray(batch.items)) {
              batch.items.forEach((item) => {
                if (product.color) {
                  if (item.colorName === product.color) {
                    availableStock += item.quantity || 0;
                  }
                } else {
                  availableStock += item.quantity || 0;
                }
              });
            }
          });

          throw new Error(
            `Insufficient stock for ${product.name}. Requested: ${product.quantity}, Available: ${availableStock}`
          );
        }

        results.push({
          fabricId: product.fabricId,
          productName: product.name,
          quantityReduced: product.quantity,
          success: true,
        });

        logger.info(
          `[InventoryTransaction] Successfully processed ${product.name}`
        );
      } catch (error) {
        logger.error(
          `[InventoryTransaction] Error processing ${product.name}:`,
          error
        );
        throw error; // Re-throw to rollback entire operation
      }
    }

    logger.info("[InventoryTransaction] All inventory reductions completed", {
      totalProducts: results.length,
    });

    return results;
  },

  /**
   * Check if sufficient stock is available for products (read-only check)
   * @param {Array} products - Array of products to check
   * @returns {Promise<Object>} - Object with availability info
   */
  async checkStockAvailability(products) {
    const availability = [];

    for (const product of products) {
      if (!product.fabricId) {
        availability.push({
          productName: product.name,
          available: false,
          reason: "No fabric ID",
        });
        continue;
      }

      try {
        const fabricRef = ref(db, `fabrics/${product.fabricId}`);
        const snapshot = await get(fabricRef);

        if (!snapshot.exists()) {
          availability.push({
            productName: product.name,
            available: false,
            reason: "Fabric not found",
          });
          continue;
        }

        const fabricData = snapshot.val();
        if (!fabricData.batches || Object.keys(fabricData.batches).length === 0) {
          availability.push({
            productName: product.name,
            available: false,
            reason: "No batches available",
            currentStock: 0,
          });
          continue;
        }

        // Calculate available stock
        let availableStock = 0;
        Object.values(fabricData.batches).forEach((batch) => {
          if (batch.items && Array.isArray(batch.items)) {
            batch.items.forEach((item) => {
              if (product.color) {
                if (item.colorName === product.color) {
                  availableStock += item.quantity || 0;
                }
              } else {
                availableStock += item.quantity || 0;
              }
            });
          }
        });

        availability.push({
          productName: product.name,
          available: availableStock >= product.quantity,
          currentStock: availableStock,
          requestedQuantity: product.quantity,
          sufficient: availableStock >= product.quantity,
        });
      } catch (error) {
        logger.error(
          `[InventoryTransaction] Error checking stock for ${product.name}:`,
          error
        );
        availability.push({
          productName: product.name,
          available: false,
          reason: error.message,
        });
      }
    }

    return {
      allAvailable: availability.every((item) => item.available),
      products: availability,
    };
  },
};
