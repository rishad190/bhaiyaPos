export const calculateTotalQuantity = (fabric) => {
  if (!fabric || !fabric.batches) {
    return 0;
  }

  return fabric.batches.reduce((total, batch) => {
    if (!batch || !batch.items) {
      return total;
    }
    return total + batch.items.reduce((batchTotal, item) => batchTotal + (item.quantity || 0), 0);
  }, 0);
};
