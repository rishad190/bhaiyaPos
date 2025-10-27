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
  const updatedBatchesMap = new Map();

  // Initialize the map with all batches, ensuring quantities are numbers
  for (const batch of batches) {
    const cleanBatch = JSON.parse(JSON.stringify(batch));
    cleanBatch.quantity = Number(cleanBatch.quantity) || 0;
    if (cleanBatch.colors) {
      cleanBatch.colors.forEach(c => { c.quantity = Number(c.quantity) || 0; });
    }
    updatedBatchesMap.set(batch.id, cleanBatch);
  }

  const sortedBatches = [...batches].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  for (const batch of sortedBatches) {
    if (remainingQtyToSell <= 0) {
      break;
    }

    const batchToUpdate = updatedBatchesMap.get(batch.id);
    let availableQtyInBatch = 0;
    let isColorSale = false;

    if (color) {
      if (batchToUpdate.colors && batchToUpdate.colors.length > 0) {
        const colorInfo = batchToUpdate.colors.find(c => c.color === color);
        if (colorInfo) {
          availableQtyInBatch = colorInfo.quantity;
          isColorSale = true;
        }
      } else if (batchToUpdate.color === color) {
        availableQtyInBatch = batchToUpdate.quantity;
      }
    } else {
      availableQtyInBatch = batchToUpdate.quantity;
    }

    if (availableQtyInBatch <= 0) {
      continue;
    }

    const qtyToUseFromBatch = Math.min(remainingQtyToSell, availableQtyInBatch);

    costOfGoodsSold.push({
      batchId: batch.id,
      quantity: qtyToUseFromBatch,
      unitCost: Number(batch.unitCost) || 0,
      color: color,
    });

    if (isColorSale) {
      const colorIndex = batchToUpdate.colors.findIndex(c => c.color === color);
      batchToUpdate.colors[colorIndex].quantity -= qtyToUseFromBatch;
      batchToUpdate.quantity = batchToUpdate.colors.reduce((sum, c) => sum + c.quantity, 0);
    } else {
      batchToUpdate.quantity -= qtyToUseFromBatch;
    }

    remainingQtyToSell -= qtyToUseFromBatch;
  }

  if (remainingQtyToSell > 0) {
    throw new Error("Insufficient stock available");
  }

  return {
    costOfGoodsSold,
    updatedBatches: Array.from(updatedBatchesMap.values()),
    totalCost: costOfGoodsSold.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    ),
  };
}