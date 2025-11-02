export function calculateWeightedAverage(batches) {
  if (!batches?.length) return 0;

  const totalValue = batches.reduce(
    (sum, batch) => (sum + (Number(batch.quantity) || 0) * (Number(batch.unitCost) || 0)),
    0
  );

  const totalQuantity = batches.reduce((sum, batch) => sum + (Number(batch.quantity) || 0), 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
}

export function calculateFifoSale(batches, soldQuantity, color = null) {
  let remainingQtyToSell = Number(soldQuantity) || 0;
  const costOfGoodsSold = [];
  const updatedBatches = JSON.parse(JSON.stringify(batches));

  const sortedBatches = updatedBatches.sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  for (const batch of sortedBatches) {
    if (remainingQtyToSell <= 0) {
      break;
    }

    if (color && batch.color !== color) {
      continue;
    }

    const availableQtyInBatch = Number(batch.quantity) || 0;
    if (availableQtyInBatch <= 0) {
      continue;
    }

    const qtyToUseFromBatch = Math.min(
      remainingQtyToSell,
      availableQtyInBatch
    );

    costOfGoodsSold.push({
      batchId: batch.id,
      quantity: qtyToUseFromBatch,
      unitCost: Number(batch.unitCost) || 0,
    });

    batch.quantity -= qtyToUseFromBatch;
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