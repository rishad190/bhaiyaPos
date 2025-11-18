# Optimistic Updates Implementation Guide

## Overview

Optimistic updates make the UI feel instant by updating the cache immediately, before the server responds. If the server fails, React Query automatically rolls back the change.

## Problem

Currently, when adding/editing/deleting data:
1. User clicks "Save"
2. Request sent to server
3. Wait for response (network delay)
4. Invalidate query
5. Refetch data
6. UI updates

**Result**: 1-2 second delay before UI updates ❌

## Solution: Optimistic Updates

With optimistic updates:
1. User clicks "Save"
2. **UI updates immediately** ✅
3. Request sent to server in background
4. If success: Keep the optimistic update
5. If error: Roll back to previous state

**Result**: Instant UI update, feels like a native app! ✅

## Implementation

### 1. Optimistic Add Customer

**File**: `src/hooks/useCustomers.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import logger from '@/utils/logger';

export function useAddCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerData) => customerService.addCustomer(customerData),
    
    // Optimistic update
    onMutate: async (newCustomer) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      // Snapshot the previous value
      const previousCustomers = queryClient.getQueryData(['customers', 'list']);

      // Optimistically update to the new value
      queryClient.setQueryData(['customers', 'list'], (old) => {
        if (!old) return old;
        
        // Create optimistic customer with temporary ID
        const optimisticCustomer = {
          id: `temp-${Date.now()}`,
          ...newCustomer,
          createdAt: new Date().toISOString(),
        };

        return {
          ...old,
          data: [optimisticCustomer, ...old.data],
          total: old.total + 1,
        };
      });

      // Return context with previous value
      return { previousCustomers };
    },

    // If mutation fails, rollback
    onError: (error, newCustomer, context) => {
      // Restore previous value
      queryClient.setQueryData(
        ['customers', 'list'],
        context.previousCustomers
      );

      logger.error('[useAddCustomer] Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive',
      });
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },

    // On success, show toast
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer added successfully',
      });
    },
  });
}
```

### 2. Optimistic Update Customer

```javascript
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ customerId, updatedData }) =>
      customerService.updateCustomer(customerId, updatedData),
    
    onMutate: async ({ customerId, updatedData }) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      const previousCustomers = queryClient.getQueryData(['customers', 'list']);

      // Optimistically update
      queryClient.setQueryData(['customers', 'list'], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((customer) =>
            customer.id === customerId
              ? { ...customer, ...updatedData, updatedAt: new Date().toISOString() }
              : customer
          ),
        };
      });

      // Also update single customer query if it exists
      queryClient.setQueryData(['customers', 'detail', customerId], (old) => {
        if (!old) return old;
        return { ...old, ...updatedData, updatedAt: new Date().toISOString() };
      });

      return { previousCustomers };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(['customers', 'list'], context.previousCustomers);
      
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer updated successfully',
      });
    },
  });
}
```

### 3. Optimistic Delete Customer

```javascript
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (customerId) => customerService.deleteCustomer(customerId),
    
    onMutate: async (customerId) => {
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      const previousCustomers = queryClient.getQueryData(['customers', 'list']);

      // Optimistically remove
      queryClient.setQueryData(['customers', 'list'], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.filter((customer) => customer.id !== customerId),
          total: old.total - 1,
        };
      });

      return { previousCustomers };
    },

    onError: (error, customerId, context) => {
      queryClient.setQueryData(['customers', 'list'], context.previousCustomers);
      
      toast({
        title: 'Error',
        description: 'Failed to delete customer',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Customer deleted successfully',
      });
    },
  });
}
```

### 4. Optimistic Add Transaction

**File**: `src/hooks/useTransactions.js`

```javascript
export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionData) => transactionService.addTransaction(transactionData),
    
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      const previousTransactions = queryClient.getQueryData(['transactions', 'list']);

      // Optimistically add transaction
      queryClient.setQueryData(['transactions', 'list'], (old) => {
        if (!old) return old;

        const optimisticTransaction = {
          id: `temp-${Date.now()}`,
          ...newTransaction,
          createdAt: new Date().toISOString(),
        };

        return {
          ...old,
          data: [optimisticTransaction, ...old.data],
          total: old.total + 1,
        };
      });

      // Also update customer transactions if customerId exists
      if (newTransaction.customerId) {
        queryClient.setQueryData(
          ['transactions', 'customer', newTransaction.customerId],
          (old) => {
            if (!old) return [newTransaction];
            return [newTransaction, ...old];
          }
        );
      }

      return { previousTransactions };
    },

    onError: (error, newTransaction, context) => {
      queryClient.setQueryData(['transactions', 'list'], context.previousTransactions);
      
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (variables.customerId) {
        queryClient.invalidateQueries({
          queryKey: ['transactions', 'customer', variables.customerId],
        });
      }
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    },
  });
}
```

### 5. Optimistic Updates for All Entities

Apply the same pattern to:
- **Suppliers** (`src/hooks/useSuppliers.js`)
- **Fabrics** (`src/hooks/useFabrics.js`)
- **Daily Cash** (`src/hooks/useDailyCash.js`)

## Advanced: Optimistic Updates with Related Data

### Example: Update Customer Due Amount

When adding a transaction, also update the customer's due amount optimistically:

```javascript
export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (transactionData) => transactionService.addTransaction(transactionData),
    
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      await queryClient.cancelQueries({ queryKey: ['customers'] });

      // Snapshot previous values
      const previousTransactions = queryClient.getQueryData(['transactions', 'list']);
      const previousCustomers = queryClient.getQueryData(['customers', 'list']);

      // Add transaction optimistically
      queryClient.setQueryData(['transactions', 'list'], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: [{ id: `temp-${Date.now()}`, ...newTransaction }, ...old.data],
          total: old.total + 1,
        };
      });

      // Update customer's due amount optimistically
      queryClient.setQueryData(['customers', 'list'], (old) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((customer) => {
            if (customer.id === newTransaction.customerId) {
              const newDue = (customer.due || 0) + 
                (newTransaction.total - newTransaction.deposit);
              return { ...customer, due: newDue };
            }
            return customer;
          }),
        };
      });

      return { previousTransactions, previousCustomers };
    },

    onError: (error, newTransaction, context) => {
      // Rollback both transactions and customers
      queryClient.setQueryData(['transactions', 'list'], context.previousTransactions);
      queryClient.setQueryData(['customers', 'list'], context.previousCustomers);
      
      toast({
        title: 'Error',
        description: 'Failed to add transaction',
        variant: 'destructive',
      });
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Transaction added successfully',
      });
    },
  });
}
```

## Visual Feedback During Optimistic Updates

### Add Loading Indicators

```javascript
export function CustomerList() {
  const { data, isLoading } = useCustomers();
  const addMutation = useAddCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // Show which operation is pending
  const isPending = 
    addMutation.isPending || 
    updateMutation.isPending || 
    deleteMutation.isPending;

  return (
    <div>
      {isPending && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        </div>
      )}
      
      {/* Customer list */}
    </div>
  );
}
```

### Mark Optimistic Items

```javascript
export function CustomerTable({ customers }) {
  return (
    <Table>
      <TableBody>
        {customers.map((customer) => (
          <TableRow 
            key={customer.id}
            className={customer.id.startsWith('temp-') ? 'opacity-60' : ''}
          >
            <TableCell>
              {customer.name}
              {customer.id.startsWith('temp-') && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Saving...)
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Benefits

### User Experience
- ✅ **Instant feedback** - UI updates immediately
- ✅ **Feels native** - No waiting for server
- ✅ **Better perceived performance** - App feels faster
- ✅ **Smooth animations** - No jarring updates

### Technical
- ✅ **Automatic rollback** - React Query handles errors
- ✅ **Consistent state** - Cache stays in sync
- ✅ **Network efficiency** - Fewer refetches
- ✅ **Offline-ready** - Works with offline mutations

## Comparison

### Without Optimistic Updates
```
User clicks "Add Customer"
  ↓
Show loading spinner (500ms)
  ↓
Wait for server response (500ms)
  ↓
Invalidate query
  ↓
Refetch data (500ms)
  ↓
UI updates

Total: 1.5 seconds ❌
```

### With Optimistic Updates
```
User clicks "Add Customer"
  ↓
UI updates immediately (0ms) ✅
  ↓
Server request in background (1s)
  ↓
Confirm or rollback

Total: Feels instant! ✅
```

## Testing

### Test Scenarios

1. **Success Case**
   - Add customer
   - UI updates immediately
   - Server confirms
   - Customer stays in list

2. **Error Case**
   - Add customer
   - UI updates immediately
   - Server fails
   - Customer removed from list
   - Error toast shown

3. **Network Delay**
   - Add customer
   - UI updates immediately
   - Slow network (3s)
   - Customer marked as "Saving..."
   - Eventually confirms

4. **Offline**
   - Add customer
   - UI updates immediately
   - No network
   - Queued for later
   - Syncs when online

## Best Practices

### 1. Always Cancel Outgoing Queries
```javascript
await queryClient.cancelQueries({ queryKey: ['customers'] });
```

### 2. Always Snapshot Previous State
```javascript
const previousData = queryClient.getQueryData(['customers', 'list']);
return { previousData };
```

### 3. Always Rollback on Error
```javascript
onError: (error, variables, context) => {
  queryClient.setQueryData(['customers', 'list'], context.previousData);
}
```

### 4. Always Refetch on Settled
```javascript
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['customers'] });
}
```

### 5. Use Temporary IDs
```javascript
const optimisticItem = {
  id: `temp-${Date.now()}`,
  ...newData,
};
```

## Implementation Checklist

### Phase 1: Core Entities
- [ ] Customers (Add, Update, Delete)
- [ ] Transactions (Add, Update, Delete)
- [ ] Suppliers (Add, Update, Delete)

### Phase 2: Secondary Entities
- [ ] Fabrics (Add, Update, Delete)
- [ ] Daily Cash (Add, Update, Delete)
- [ ] Settings (Update)

### Phase 3: Complex Operations
- [ ] Inventory reduction (with rollback)
- [ ] Batch operations
- [ ] Related data updates

### Phase 4: Polish
- [ ] Visual feedback for pending operations
- [ ] Mark optimistic items
- [ ] Loading indicators
- [ ] Error recovery UI

## Estimated Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Perceived Speed | 1.5s | Instant | **Feels 10x faster** |
| User Satisfaction | Good | Excellent | **Native app feel** |
| Network Requests | Many | Fewer | **More efficient** |
| Error Handling | Manual | Automatic | **More reliable** |

## Conclusion

Optimistic updates transform the user experience from "waiting for server" to "instant feedback". Combined with the React Query migration, your app will feel like a native desktop application!

---

**Priority**: HIGH
**Impact**: HIGH (Better UX)
**Effort**: MEDIUM (2-3 hours)
**Risk**: LOW (React Query handles rollback)
