# 🔄 DataContext to React Query Migration Guide

## 📋 Files That Need Migration

The following files still import from `@/app/data-context` and need to be migrated to React Query hooks:

1. `src/components/ClientLayout.js` - Uses DataProvider
2. `src/components/Navbar.js` - Uses useData
3. `src/components/AddCustomerDialog.js` - Uses useData
4. `src/app/customers/[id]/page.js` - Uses useData
5. `src/app/suppliers/[id]/page.js` - Uses useData
6. `src/app/inventory/[id]/page.js` - Uses useData
7. `src/app/inventory-profit/page.js` - Uses useData
8. `src/app/inventory-profit/[id]/page.js` - Uses useData
9. `src/app/profit-details/page.js` - Uses useData
10. `src/app/settings/page.js` - Uses useData

---

## 🔄 Migration Patterns

### Pattern 1: Remove DataProvider

**Before:**
```javascript
import { DataProvider } from "@/app/data-context";

export function ClientLayout({ children }) {
  return (
    <DataProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </DataProvider>
  );
}
```

**After:**
```javascript
// Remove DataProvider import
import { QueryProvider } from "@/providers/QueryProvider";

export function ClientLayout({ children }) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}
```

---

### Pattern 2: Replace useData with Specific Hooks

**Before:**
```javascript
import { useData } from "@/app/data-context";

function MyComponent() {
  const { customers, transactions, addCustomer } = useData();
  // ...
}
```

**After:**
```javascript
import { useCustomers, useAddCustomer } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";

function MyComponent() {
  const { data: customers } = useCustomers();
  const { data: transactions } = useTransactions();
  const addCustomerMutation = useAddCustomer();
  
  const handleAddCustomer = async (data) => {
    await addCustomerMutation.mutateAsync(data);
  };
  // ...
}
```

---

### Pattern 3: Customer Operations

**Before:**
```javascript
const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();

// Add
await addCustomer(data);

// Update
await updateCustomer(id, data);

// Delete
await deleteCustomer(id);
```

**After:**
```javascript
import { 
  useCustomers, 
  useAddCustomer, 
  useUpdateCustomer, 
  useDeleteCustomer 
} from "@/hooks/useCustomers";

const { data: customers } = useCustomers();
const addMutation = useAddCustomer();
const updateMutation = useUpdateCustomer();
const deleteMutation = useDeleteCustomer();

// Add
await addMutation.mutateAsync(data);

// Update
await updateMutation.mutateAsync({ customerId: id, data });

// Delete
await deleteMutation.mutateAsync(id);
```

---

### Pattern 4: Transaction Operations

**Before:**
```javascript
const { transactions, addTransaction } = useData();

await addTransaction(data);
```

**After:**
```javascript
import { useTransactions, useAddTransaction } from "@/hooks/useTransactions";

const { data: transactions } = useTransactions();
const addMutation = useAddTransaction();

await addMutation.mutateAsync(data);
```

---

### Pattern 5: Supplier Operations

**Before:**
```javascript
const { suppliers, addSupplier, deleteSupplier } = useData();

await addSupplier(data);
await deleteSupplier(id);
```

**After:**
```javascript
import { useSuppliers, useAddSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";

const { data: suppliers } = useSuppliers();
const addMutation = useAddSupplier();
const deleteMutation = useDeleteSupplier();

await addMutation.mutateAsync(data);
await deleteMutation.mutateAsync(id);
```

---

### Pattern 6: Fabric Operations

**Before:**
```javascript
const { fabrics, addFabric, reduceInventory } = useData();

await addFabric(data);
await reduceInventory(products);
```

**After:**
```javascript
import { useFabrics, useAddFabric, useReduceInventory } from "@/hooks/useFabrics";

const { data: fabrics } = useFabrics();
const addMutation = useAddFabric();
const reduceMutation = useReduceInventory();

await addMutation.mutateAsync(data);
await reduceMutation.mutateAsync(products);
```

---

### Pattern 7: Settings Operations

**Before:**
```javascript
const { settings, updateSettings } = useData();

await updateSettings(newSettings);
```

**After:**
```javascript
// Create useSettings hook if it doesn't exist
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";

const { data: settings } = useSettings();
const updateMutation = useUpdateSettings();

await updateMutation.mutateAsync(newSettings);
```

---

### Pattern 8: Loading States

**Before:**
```javascript
const { loading, customers } = useData();

if (loading) return <Spinner />;
```

**After:**
```javascript
const { data: customers, isLoading } = useCustomers();

if (isLoading) return <Spinner />;
```

---

### Pattern 9: Error Handling

**Before:**
```javascript
try {
  await addCustomer(data);
} catch (error) {
  console.error(error);
}
```

**After:**
```javascript
const addMutation = useAddCustomer();

try {
  await addMutation.mutateAsync(data);
} catch (error) {
  // Error automatically handled by React Query
  // UI automatically rolled back if optimistic update
  toast.error(error.message);
}
```

---

### Pattern 10: Computed Values

**Before:**
```javascript
const { customers, transactions, getCustomerDue } = useData();

const due = getCustomerDue(customerId);
```

**After:**
```javascript
import { useCustomersWithDues } from "@/hooks/useCustomersWithDues";

const { data: customersWithDues } = useCustomersWithDues();
const customer = customersWithDues?.find(c => c.id === customerId);
const due = customer?.totalDue || 0;
```

---

## 🎯 Complete Migration Checklist

### Step 1: Update ClientLayout
- [ ] Remove DataProvider import
- [ ] Remove DataProvider wrapper
- [ ] Keep only QueryProvider

### Step 2: Update Components
- [ ] Navbar.js
- [ ] AddCustomerDialog.js

### Step 3: Update Customer Pages
- [ ] customers/[id]/page.js

### Step 4: Update Supplier Pages
- [ ] suppliers/[id]/page.js

### Step 5: Update Inventory Pages
- [ ] inventory/[id]/page.js
- [ ] inventory-profit/page.js
- [ ] inventory-profit/[id]/page.js

### Step 6: Update Other Pages
- [ ] profit-details/page.js
- [ ] settings/page.js

### Step 7: Create Missing Hooks (if needed)
- [ ] useSettings.js (if not exists)
- [ ] Any other missing hooks

### Step 8: Test
- [ ] Build succeeds
- [ ] All pages load
- [ ] All CRUD operations work
- [ ] Optimistic updates work
- [ ] Error handling works

---

## 📚 Available React Query Hooks

### Customers
```javascript
import { 
  useCustomers,           // Get all customers
  useAddCustomer,         // Add customer
  useUpdateCustomer,      // Update customer
  useDeleteCustomer,      // Delete customer
  useCustomersWithDues    // Get customers with dues
} from "@/hooks/useCustomers";
```

### Transactions
```javascript
import { 
  useTransactions,        // Get all transactions
  useAddTransaction,      // Add transaction
  useUpdateTransaction,   // Update transaction
  useDeleteTransaction    // Delete transaction
} from "@/hooks/useTransactions";
```

### Suppliers
```javascript
import { 
  useSuppliers,                    // Get all suppliers
  useAddSupplier,                  // Add supplier
  useDeleteSupplier,               // Delete supplier
  useSuppliersWithTransactions     // Get suppliers with transactions
} from "@/hooks/useSuppliers";
```

### Fabrics
```javascript
import { 
  useFabrics,             // Get all fabrics
  useAddFabric,           // Add fabric
  useUpdateFabric,        // Update fabric
  useDeleteFabric,        // Delete fabric
  useAddFabricBatch,      // Add batch
  useReduceInventory      // Reduce inventory
} from "@/hooks/useFabrics";
```

### Daily Cash
```javascript
import { 
  useDailyCash,           // Get daily cash transactions
  useAddDailyCash,        // Add daily cash transaction
  useUpdateDailyCash,     // Update daily cash transaction
  useDeleteDailyCash      // Delete daily cash transaction
} from "@/hooks/useDailyCash";
```

---

## 🎉 Benefits After Migration

1. **Better Performance**: Only load data you need
2. **Fewer Re-renders**: Components only re-render for relevant data changes
3. **Automatic Caching**: Data cached automatically
4. **Optimistic Updates**: UI updates immediately
5. **Automatic Retries**: Failed requests retry automatically
6. **Better Error Handling**: Errors handled gracefully
7. **Offline Support**: Works offline with PWA
8. **Easier Testing**: Each hook can be tested independently
9. **Better Developer Experience**: Clear, focused hooks
10. **Production Ready**: Modern, scalable architecture

---

## 🚀 Let's Migrate!

Follow the patterns above to migrate each file. The migration is straightforward:
1. Replace `useData()` with specific hooks
2. Replace direct function calls with mutation hooks
3. Handle loading and error states properly
4. Test thoroughly

**You've got this! 💪**
