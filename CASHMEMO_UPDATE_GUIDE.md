# Cashmemo Page Update Guide

## Quick Implementation

To fix the race condition in the cashmemo page, follow these steps:

### Step 1: Import the New Hook

Add this import at the top of `src/app/cashmemo/page.js`:

```javascript
import { useReduceInventory } from '@/hooks/useInventoryTransaction';
```

### Step 2: Use the Hook

In the component, add:

```javascript
const reduceInventoryMutation = useReduceInventory();
```

### Step 3: Replace the Old reduceInventory Call

Find the `handleSaveMemo` function and replace:

```javascript
// OLD (UNSAFE)
await reduceInventory(productsWithValidFabricIds);
```

With:

```javascript
// NEW (SAFE)
await reduceInventoryMutation.mutateAsync(productsWithValidFabricIds);
```

### Step 4: Update Loading State

Replace:

```javascript
disabled={loadingState.actions}
```

With:

```javascript
disabled={reduceInventoryMutation.isPending || loadingState.actions}
```

## Complete Example

Here's what the updated `handleSaveMemo` should look like:

```javascript
const handleSaveMemo = async () => {
  try {
    // Validate inputs
    if (!customerId) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }

    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    // Prepare products with valid fabric IDs
    const productsWithValidFabricIds = products.map((product) => ({
      ...product,
      fabricId: product.fabricId || product.id,
    }));

    // 1. Reduce inventory atomically (SAFE - prevents race conditions)
    await reduceInventoryMutation.mutateAsync(productsWithValidFabricIds);

    // 2. Create transaction record
    const transactionData = {
      customerId,
      products: productsWithValidFabricIds,
      total: calculateTotal(),
      deposit: parseFloat(deposit) || 0,
      due: calculateTotal() - (parseFloat(deposit) || 0),
      date: new Date().toISOString(),
      memoNumber: generateMemoNumber(),
    };

    await addTransaction(transactionData);

    // 3. Add daily cash transaction if deposit exists
    if (deposit > 0) {
      await addDailyCashTransaction({
        type: "sale",
        cashIn: parseFloat(deposit),
        cashOut: 0,
        description: `Sale to ${customerName}`,
        date: new Date().toISOString(),
        reference: transactionData.memoNumber,
      });
    }

    // Success!
    toast({
      title: "Success",
      description: "Sale completed successfully",
    });

    // Reset form
    resetForm();

  } catch (error) {
    logger.error("Error saving memo:", error);
    // Error toast already shown by mutation hook
  }
};
```

## Benefits of This Change

1. **Prevents Overselling** ✅
   - Impossible to sell more than available stock
   - Atomic operations guarantee consistency

2. **Handles Concurrent Users** ✅
   - Multiple cashiers can work simultaneously
   - Firebase automatically handles conflicts

3. **Better Error Messages** ✅
   - Clear feedback when stock is insufficient
   - Shows exact available quantity

4. **Automatic UI Updates** ✅
   - Inventory list refreshes automatically
   - No manual refetch needed

## Testing

After implementing, test these scenarios:

1. **Normal Sale**
   - Sell products with sufficient stock
   - Should succeed

2. **Insufficient Stock**
   - Try to sell more than available
   - Should show error with available quantity

3. **Concurrent Sales** (requires 2 browsers)
   - Open cashmemo in 2 browser windows
   - Try to sell the last piece simultaneously
   - One should succeed, one should fail

## Rollback Plan

If you need to rollback:

1. Remove the import:
   ```javascript
   // Remove this line
   import { useReduceInventory } from '@/hooks/useInventoryTransaction';
   ```

2. Remove the hook usage:
   ```javascript
   // Remove this line
   const reduceInventoryMutation = useReduceInventory();
   ```

3. Restore the old call:
   ```javascript
   // Restore this
   await reduceInventory(productsWithValidFabricIds);
   ```

## Notes

- The old `reduceInventory` from DataContext will still work
- You can migrate gradually (one page at a time)
- The new approach is backward compatible
- No database schema changes required

---

**Priority**: HIGH
**Estimated Time**: 15 minutes
**Risk**: LOW (backward compatible)
**Impact**: Prevents financial losses from overselling
