/**
 * Calculate weighted average cost for a set of batches
 * @param {Array<{quantity: number, unitCost: number}>} batches
 * @returns {number}
 */
export function calculateWeightedAverage(batches) {
  if (!Array.isArray(batches) || !batches.length) return 0;

  const totalValue = batches.reduce(
    (sum, batch) =>
      sum + (Number(batch?.quantity) || 0) * (Number(batch?.unitCost) || 0),
    0
  );

  const totalQuantity = batches.reduce(
    (sum, batch) => sum + (Number(batch?.quantity) || 0),
    0
  );

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

/**
 * Calculate total quantity for a fabric across all batches and colors
 * @param {import('./mockData').Fabric} fabric
 * @returns {number}
 */
export function calculateTotalQuantity(fabric) {
  if (!fabric?.batches?.length) return 0;

  return fabric.batches.reduce(
    (total, batch) =>
      total +
      (batch.items?.reduce(
        (batchTotal, item) => batchTotal + (Number(item?.quantity) || 0),
        0
      ) || 0),
    0
  );
}

/**
 * Get quantity by color for a fabric
 * @param {import('./mockData').Fabric} fabric
 * @returns {Object.<string, number>}
 */
export function getQuantityByColor(fabric) {
  if (!fabric?.batches?.length) return {};

  return fabric.batches.reduce((colorMap, batch) => {
    batch.items?.forEach((item) => {
      if (item?.colorName && item?.quantity) {
        colorMap[item.colorName] =
          (colorMap[item.colorName] || 0) + Number(item.quantity);
      }
    });
    return colorMap;
  }, {});
}

/**
 * Check if fabric is low on stock
 * @param {import('./mockData').Fabric} fabric
 * @returns {boolean}
 */
export function isLowStock(fabric) {
  if (!fabric) return false;
  const totalQty = calculateTotalQuantity(fabric);
  const threshold = Number(fabric.lowStockThreshold) || 0;
  return totalQty <= threshold;
}

/**
 * Get available colors for a fabric with their quantities
 * @param {import('./mockData').Fabric} fabric
 * @returns {Array<{color: string, quantity: number}>}
 */
export function getAvailableColors(fabric) {
  const colorMap = getQuantityByColor(fabric);
  return Object.entries(colorMap)
    .map(([color, quantity]) => ({ color, quantity }))
    .filter((item) => item.quantity > 0);
}

/**
 * Calculate average cost per piece for a fabric
 * @param {import('./mockData').Fabric} fabric
 * @returns {number}
 */
export function calculateAverageCost(fabric) {
  if (!fabric?.batches?.length) return 0;

  const totalItems = fabric.batches.reduce(
    (sum, batch) =>
      sum +
      (batch.items?.reduce(
        (batchSum, item) => batchSum + (Number(item?.quantity) || 0),
        0
      ) || 0),
    0
  );

  const totalCost = fabric.batches.reduce((sum, batch) => {
    const batchCost = Number(batch?.costPerPiece) || 0;
    const batchQuantity =
      batch.items?.reduce(
        (batchSum, item) => batchSum + (Number(item?.quantity) || 0),
        0
      ) || 0;
    return sum + batchCost * batchQuantity;
  }, 0);

  return totalItems > 0 ? totalCost / totalItems : 0;
}

/**
 * Get batch details by color
 * @param {import('./mockData').Fabric} fabric
 * @param {string} color
 * @returns {Array<{batchId: string, batchNumber: string, purchaseDate: string, quantity: number, costPerPiece: number}>}
 */
export function getBatchesByColor(fabric, color) {
  if (!fabric?.batches?.length || !color?.trim()) return [];

  return fabric.batches.reduce((acc, batch) => {
    if (!batch?.items?.length) return acc;

    const colorItem = batch.items.find(
      (item) => item?.colorName?.toLowerCase() === color.toLowerCase()
    );

    if (colorItem) {
      acc.push({
        batchId: batch.id || "",
        batchNumber: batch.batchNumber || "",
        purchaseDate: batch.purchaseDate || new Date().toISOString(),
        quantity: Number(colorItem.quantity) || 0,
        costPerPiece: Number(batch.costPerPiece) || 0,
      });
    }
    return acc;
  }, []);
}

/**
 * Calculate FIFO cost for a sale transaction
 * @param {Array<{id: string, quantity: number, unitCost: number, color?: string, createdAt: string}>} batches
 * @param {number} soldQuantity
 * @param {string|null} color
 * @returns {{
 *   costOfGoodsSold: Array<{batchId: string, quantity: number, unitCost: number}>,
 *   updatedBatches: Array<{id: string, quantity: number, unitCost: number, color?: string}>
 * }}
 */
export function calculateFifoSale(batches, soldQuantity, color = null) {
  if (!Array.isArray(batches))
    return { costOfGoodsSold: [], updatedBatches: [] };

  let remainingQtyToSell = Number(soldQuantity) || 0;
  if (remainingQtyToSell <= 0)
    return { costOfGoodsSold: [], updatedBatches: batches };

  const costOfGoodsSold = [];
  const updatedBatches = JSON.parse(JSON.stringify(batches));

  const sortedBatches = updatedBatches.sort((a, b) => {
    try {
      return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
    } catch {
      return 0;
    }
  });

  for (const batch of sortedBatches) {
    if (remainingQtyToSell <= 0) break;

    if (!batch?.id) continue;
    if (color?.trim() && batch?.color?.toLowerCase() !== color.toLowerCase())
      continue;

    const availableQtyInBatch = Number(batch.quantity) || 0;
    if (availableQtyInBatch <= 0) continue;

    const qtyToUseFromBatch = Math.min(remainingQtyToSell, availableQtyInBatch);

    costOfGoodsSold.push({
      batchId: batch.id,
      quantity: qtyToUseFromBatch,
      unitCost: Number(batch.unitCost) || 0,
    });

    batch.quantity = availableQtyInBatch - qtyToUseFromBatch;
    remainingQtyToSell -= qtyToUseFromBatch;
  }

  if (remainingQtyToSell > 0) {
    throw new Error("Insufficient stock available");
  }

  return {
    costOfGoodsSold,
    updatedBatches,
    totalCost: costOfGoodsSold.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    ),
  };
}
