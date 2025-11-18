# 🔄 Remaining DataContext Migrations

## ✅ Completed Migrations

1. ✅ **src/components/ClientLayout.js** - Removed DataProvider
2. ✅ **src/components/Navbar.js** - Migrated to useSettings
3. ✅ **src/components/AddCustomerDialog.js** - Migrated to useAddCustomer
4. ✅ **src/hooks/useSettings.js** - Created new hook

---

## 📋 Remaining Files to Migrate

### 1. src/app/customers/[id]/page.js
**Uses from DataContext:**
- `customers`
- `transactions`
- `updateCustomer`
- `deleteCustomer`
- `getCustomerDue`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";
const { customers, transactions, updateCustomer, deleteCustomer, getCustomerDue } = useData();

// With
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { useCustomersWithDues } from "@/hooks/useCustomersWithDues";

const { data: customers } = useCustomers();
const { data: transactions } = useTransactions();
const updateMutation = useUpdateCustomer();
const deleteMutation = useDeleteCustomer();
const { data: customersWithDues } = useCustomersWithDues();

// For getCustomerDue
const customer = customersWithDues?.find(c => c.id === customerId);
const due = customer?.totalDue || 0;
```

---

### 2. src/app/suppliers/[id]/page.js
**Uses from DataContext:**
- `suppliers`
- `supplierTransactions`
- `updateSupplier`
- `deleteSupplier`
- `addSupplierTransaction`
- `deleteSupplierTransaction`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";

// With
import { useSuppliers, useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
// Note: May need to create useSupplierTransactions hook
```

---

### 3. src/app/inventory/[id]/page.js
**Uses from DataContext:**
- `fabrics`
- `updateFabric`
- `deleteFabric`
- `addFabricBatch`
- `updateFabricBatch`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";

// With
import { 
  useFabrics, 
  useUpdateFabric, 
  useDeleteFabric,
  useAddFabricBatch,
  useUpdateFabricBatch 
} from "@/hooks/useFabrics";
```

---

### 4. src/app/inventory-profit/page.js
**Uses from DataContext:**
- `fabrics`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";
const { fabrics } = useData();

// With
import { useFabrics } from "@/hooks/useFabrics";
const { data: fabrics } = useFabrics();
```

---

### 5. src/app/inventory-profit/[id]/page.js
**Uses from DataContext:**
- `fabrics`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";
const { fabrics } = useData();

// With
import { useFabrics } from "@/hooks/useFabrics";
const { data: fabrics } = useFabrics();
```

---

### 6. src/app/profit-details/page.js
**Uses from DataContext:**
- `fabrics`
- `transactions`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";
const { fabrics, transactions } = useData();

// With
import { useFabrics } from "@/hooks/useFabrics";
import { useTransactions } from "@/hooks/useTransactions";

const { data: fabrics } = useFabrics();
const { data: transactions } = useTransactions();
```

---

### 7. src/app/settings/page.js
**Uses from DataContext:**
- `settings`
- `updateSettings`

**Migration:**
```javascript
// Replace
import { useData } from "@/app/data-context";
const { settings, updateSettings } = useData();

// With
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";

const { data: settings } = useSettings();
const updateMutation = useUpdateSettings();

// When updating
await updateMutation.mutateAsync(newSettings);
```

---

## 🔧 Additional Hooks Needed

### useSupplierTransactions.js
May need to create this hook for supplier transaction operations:
- `useSupplierTransactions()` - Fetch supplier transactions
- `useAddSupplierTransaction()` - Add supplier transaction
- `useDeleteSupplierTransaction()` - Delete supplier transaction

### useUpdateFabricBatch.js
May need to add this to useFabrics.js if not already there:
- `useUpdateFabricBatch()` - Update fabric batch

---

## 🎯 Migration Priority

### High Priority (Blocking Build)
1. ✅ ClientLayout.js - DONE
2. ✅ Navbar.js - DONE
3. ✅ AddCustomerDialog.js - DONE
4. ⏳ customers/[id]/page.js
5. ⏳ suppliers/[id]/page.js
6. ⏳ inventory/[id]/page.js

### Medium Priority
7. ⏳ inventory-profit/page.js
8. ⏳ inventory-profit/[id]/page.js
9. ⏳ profit-details/page.js

### Low Priority
10. ⏳ settings/page.js

---

## 📝 Migration Template

For each file, follow this pattern:

1. **Identify what's used from useData**
2. **Import the appropriate React Query hooks**
3. **Replace useData() with specific hooks**
4. **Update function calls to use mutations**
5. **Add loading/error states if needed**
6. **Test the page**

---

## 🚀 Quick Migration Script

For simple read-only pages:

```javascript
// Before
import { useData } from "@/app/data-context";
const { fabrics, loading } = useData();

// After
import { useFabrics } from "@/hooks/useFabrics";
const { data: fabrics, isLoading } = useFabrics();
```

For pages with mutations:

```javascript
// Before
import { useData } from "@/app/data-context";
const { fabrics, addFabric } = useData();
await addFabric(data);

// After
import { useFabrics, useAddFabric } from "@/hooks/useFabrics";
const { data: fabrics } = useFabrics();
const addMutation = useAddFabric();
await addMutation.mutateAsync(data);
```

---

## ✅ Testing Checklist

After each migration:
- [ ] File imports correctly
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Loading states work
- [ ] Error states work
- [ ] Mutations work (add/update/delete)
- [ ] Optimistic updates work
- [ ] No console errors

---

## 🎉 When Complete

Once all files are migrated:
1. Run `npm run build` - should succeed
2. Test all pages manually
3. Verify all CRUD operations work
4. Check React Query DevTools
5. Celebrate! 🎊

The architecture will be:
- ✅ Modern and scalable
- ✅ Better performance
- ✅ Easier to maintain
- ✅ Production-ready
