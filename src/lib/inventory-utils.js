export function calculateWeightedAverage(batches) {
  if (!batches?.length) return 0;

  const totalValue = batches.reduce(
    (sum, batch) => sum + batch.quantity * batch.unitCost,
    0
  );

  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

export function calculateFifoSale(batches, soldQuantity) {
  let remainingQty = soldQuantity;
  const costOfGoodsSold = [];
  const updatedBatches = [];

  // Sort batches by purchase date
  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate)
  );

  for (const batch of sortedBatches) {
    if (remainingQty <= 0) {
      updatedBatches.push(batch);
      continue;
    }

    const usedQty = Math.min(remainingQty, batch.quantity);
    if (usedQty > 0) {
      costOfGoodsSold.push({
        batchId: batch.id,
        quantity: usedQty,
        unitCost: batch.unitCost,
      });

      const remainingBatchQty = batch.quantity - usedQty;
      if (remainingBatchQty > 0) {
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
