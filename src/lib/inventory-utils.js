export function calculateWeightedAverage(batches) {
  if (!batches?.length) return 0;

  const totalValue = batches.reduce(
    (sum, batch) => sum + batch.quantity * batch.unitCost,
    0
  );

  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

export function calculateFifoSale(batches, soldQuantity, color = null) {
  let remainingQty = soldQuantity;
  const costOfGoodsSold = [];
  const updatedBatches = [];

  let filteredBatches = [...batches];

  if (color) {
    filteredBatches = batches.map(batch => {
      if (batch.colors && batch.colors.length > 0) {
        const colorInfo = batch.colors.find(c => c.color === color);
        return colorInfo ? { ...batch, quantity: colorInfo.quantity, isColorBatch: true, originalBatch: batch } : null;
      } else if (batch.color === color) {
        return { ...batch, isColorBatch: false };
      }
      return null;
    }).filter(Boolean);
  }

  // Sort batches by purchase date
  const sortedBatches = filteredBatches.sort(
    (a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)
  );

  for (const batch of sortedBatches) {
    if (remainingQty <= 0) {
      updatedBatches.push(batch.isColorBatch ? batch.originalBatch : batch);
      continue;
    }

    const usedQty = Math.min(remainingQty, batch.quantity);
    if (usedQty > 0) {
      costOfGoodsSold.push({
        batchId: batch.isColorBatch ? batch.originalBatch.id : batch.id,
        quantity: usedQty,
        unitCost: batch.unitCost,
        color: color,
      });

      const remainingBatchQty = batch.quantity - usedQty;
      if (batch.isColorBatch) {
        const originalBatch = batch.originalBatch;
        const colorIndex = originalBatch.colors.findIndex(c => c.color === color);
        originalBatch.colors[colorIndex].quantity = remainingBatchQty;
        originalBatch.quantity = originalBatch.colors.reduce((sum, c) => sum + c.quantity, 0);
        updatedBatches.push(originalBatch);
      } else if (remainingBatchQty > 0) {
        updatedBatches.push({
          ...batch,
          quantity: remainingBatchQty,
        });
      }
    }
    remainingQty -= usedQty;
  }

  if (remainingQty > 0) {
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