# Code Quality Improvements Guide

## Overview

This guide addresses architecture and code quality issues to make the codebase more maintainable, scalable, and professional.

## 1. Centralize Hardcoded Constants ⚠️

### Problem
Store IDs ("STORE1", "STORE2") are hardcoded in 10+ files, making it difficult to:
- Add new stores
- Rename stores
- Make stores dynamic per user

### Current State
```javascript
// Scattered across multiple files
storeId: "STORE1"  // ❌ Hardcoded
<option value="STORE1">Store 1</option>  // ❌ Hardcoded
<option value="STORE2">Store 2</option>  // ❌ Hardcoded
```

### Solution: Dynamic Stores from Firebase

#### Step 1: Create Stores Collection in Firebase
```javascript
// Firebase structure
stores/
  -store1/
    id: "STORE1"
    name: "Main Store"
    address: "123 Main St"
    active: true
    createdAt: "2025-01-01"
  -store2/
    id: "STORE2"
    name: "Branch Store"
    address: "456 Oak Ave"
    active: true
    createdAt: "2025-01-01"
```

#### Step 2: Create Store Service
```javascript
// src/services/storeService.js
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

export const storeService = {
  async getStores() {
    const storesRef = ref(db, 'stores');
    const snapshot = await get(storesRef);
    
    if (!snapshot.exists()) return [];
    
    return Object.entries(snapshot.val()).map(([id, store]) => ({
      id,
      ...store,
    })).filter(store => store.active);
  },
};
```

#### Step 3: Create React Query Hook
```javascript
// src/hooks/useStores.js
import { useQuery } from '@tanstack/react-query';
import { storeService } from '@/services/storeService';

export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => storeService.getStores(),
    staleTime: 1000 * 60 * 60, // 1 hour (stores don't change often)
  });
}
```

#### Step 4: Create StoreSelect Component
```javascript
// src/components/StoreSelect.js
import { useStores } from '@/hooks/useStores';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StoreSelect({ value, onChange, includeAll = false }) {
  const { data: stores = [], isLoading } = useStores();
  
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger>
        <SelectValue placeholder="Select store" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All Stores</SelectItem>}
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### Step 5: Replace Hardcoded Selects
```javascript
// Before (Hardcoded)
<select value={storeId} onChange={handleChange}>
  <option value="STORE1">Store 1</option>
  <option value="STORE2">Store 2</option>
</select>

// After (Dynamic)
<StoreSelect value={storeId} onChange={setStoreId} />
```

### Files to Update (10 files)
1. `src/components/AddCustomerDialog.js`
2. `src/components/AddSupplierDialog.js`
3. `src/components/AddTransactionDialog.js`
4. `src/components/EditCustomerDialog.js`
5. `src/components/EditSupplierDialog.jsx`
6. `src/components/EditTransactionDialog.js`
7. `src/app/customers/[id]/page.js`
8. `src/app/suppliers/[id]/page.js`
9. `src/app/cashmemo/page.js`
10. `src/utils/addSampleData.js`

---

## 2. Standardize "Quantity" Naming ⚠️

### Problem
Inconsistent naming: `quality` vs `quantity` causes confusion and potential bugs.

### Current Issues
```javascript
// CashMemoPrint.js
<th>Quality</th>  // ❌ Should be "Quantity"
{product.quality}  // ❌ Should be "quantity"

// CashMemoPage.js
quantity: "",  // ✅ Correct
quality: "",   // ❌ Wrong (if exists)
```

### Solution: Global Find & Replace

#### Step 1: Search for "quality"
```bash
# Find all instances
grep -r "quality" src/
```

#### Step 2: Replace with "quantity"
```javascript
// Before
const [newProduct, setNewProduct] = useState({
  name: "",
  quality: "",  // ❌
  price: "",
});

// After
const [newProduct, setNewProduct] = useState({
  name: "",
  quantity: "",  // ✅
  price: "",
});
```

### Files to Update
1. `src/components/CashMemoPrint.js`
2. `src/app/cashmemo/page.js` (if any instances exist)
3. Any other files with "quality" instead of "quantity"

---

## 3. Modularize Large Components ⚠️

### Problem
`src/app/cashmemo/page.js` is 1,200+ lines and handles:
- UI rendering
- State management
- Business logic
- Calculations
- Printing
- Form validation

### Solution: Extract into Smaller Components

#### Step 1: Extract Product Entry Form

**Create**: `src/components/CashMemo/ProductEntryForm.js`

```javascript
"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ProductEntryForm({ 
  fabrics, 
  onAddProduct,
  disabled 
}) {
  const [product, setProduct] = useState({
    name: "",
    quantity: "",
    price: "",
    color: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!product.name || !product.quantity || !product.price) return;
    
    onAddProduct(product);
    setProduct({ name: "", quantity: "", price: "", color: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product selection */}
      {/* Quantity input */}
      {/* Price input */}
      {/* Color selection */}
      <Button type="submit" disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </Button>
    </form>
  );
}
```

#### Step 2: Extract Cart Calculations Hook

**Create**: `src/hooks/useCartCalculations.js`

```javascript
import { useMemo } from 'react';

export function useCartCalculations(products) {
  const calculations = useMemo(() => {
    const subtotal = products.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.cost || 0), 0);
    const totalProfit = subtotal - totalCost;
    const profitMargin = subtotal > 0 ? (totalProfit / subtotal) * 100 : 0;

    return {
      subtotal,
      totalCost,
      totalProfit,
      profitMargin,
      itemCount: products.length,
      totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
    };
  }, [products]);

  return calculations;
}
```

#### Step 3: Extract Customer Selection Component

**Create**: `src/components/CashMemo/CustomerSelection.js`

```javascript
"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";

export function CustomerSelection({ 
  customers, 
  selectedCustomer,
  onSelectCustomer 
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {selectedCustomer ? selectedCustomer.name : "Select Customer"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Command>
          <CommandInput 
            placeholder="Search customers..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                onSelect={() => {
                  onSelectCustomer(customer);
                  setOpen(false);
                }}
              >
                {customer.name} - {customer.phone}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

#### Step 4: Extract Product List Component

**Create**: `src/components/CashMemo/ProductList.js`

```javascript
"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ProductList({ products, onRemoveProduct }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => (
          <TableRow key={index}>
            <TableCell>{product.name}</TableCell>
            <TableCell>{product.color || "-"}</TableCell>
            <TableCell>{product.quantity}</TableCell>
            <TableCell>৳{product.price}</TableCell>
            <TableCell>৳{product.total}</TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveProduct(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### Step 5: Refactored CashMemo Page

**Updated**: `src/app/cashmemo/page.js`

```javascript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerSelection } from "@/components/CashMemo/CustomerSelection";
import { ProductEntryForm } from "@/components/CashMemo/ProductEntryForm";
import { ProductList } from "@/components/CashMemo/ProductList";
import { useCartCalculations } from "@/hooks/useCartCalculations";
import { useCustomers } from "@/hooks/useCustomers";
import { useFabrics } from "@/hooks/useFabrics";
import { useReduceInventory } from "@/hooks/useInventoryTransaction";
import { useAddTransaction } from "@/hooks/useTransactions";
import { useAddDailyCashTransaction } from "@/hooks/useDailyCash";

export default function CashMemoPage() {
  const router = useRouter();
  
  // Data fetching
  const { data: customersData } = useCustomers({ page: 1, limit: 10000 });
  const { data: fabricsData } = useFabrics({ page: 1, limit: 10000 });
  
  // Mutations
  const addTransactionMutation = useAddTransaction();
  const reduceInventoryMutation = useReduceInventory();
  const addDailyCashMutation = useAddDailyCashTransaction();
  
  // State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [deposit, setDeposit] = useState(0);
  
  // Calculations
  const calculations = useCartCalculations(products);
  
  // Handlers
  const handleAddProduct = (product) => {
    setProducts([...products, product]);
  };
  
  const handleRemoveProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };
  
  const handleSave = async () => {
    // Save logic (much simpler now)
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1>Cash Memo</h1>
      
      <CustomerSelection
        customers={customersData?.data || []}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
      />
      
      <ProductEntryForm
        fabrics={fabricsData?.data || []}
        onAddProduct={handleAddProduct}
        disabled={!selectedCustomer}
      />
      
      <ProductList
        products={products}
        onRemoveProduct={handleRemoveProduct}
      />
      
      {/* Summary and Save Button */}
    </div>
  );
}
```

### Benefits of Modularization

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines per file | 1,200+ | <300 | 75% reduction |
| Components | 1 | 5 | Better separation |
| Testability | Hard | Easy | ✅ |
| Reusability | No | Yes | ✅ |
| Maintainability | Low | High | ✅ |

---

## 4. Additional Improvements

### A. Extract Validation Logic
```javascript
// src/lib/validations/cashMemoValidation.js
export function validateCashMemo(data) {
  const errors = [];
  
  if (!data.customerId) {
    errors.push("Customer is required");
  }
  
  if (!data.products || data.products.length === 0) {
    errors.push("At least one product is required");
  }
  
  if (data.deposit < 0) {
    errors.push("Deposit cannot be negative");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### B. Extract Formatting Utilities
```javascript
// src/lib/formatters.js
export function formatCurrency(amount) {
  return `৳${amount.toLocaleString()}`;
}

export function formatMemoNumber(timestamp) {
  return `MEMO-${timestamp}`;
}

export function formatProductDisplay(product) {
  return product.color 
    ? `${product.name} (${product.color})`
    : product.name;
}
```

### C. Create Custom Hooks for Complex Logic
```javascript
// src/hooks/useMemoGeneration.js
export function useMemoGeneration() {
  const generateMemoNumber = () => {
    return `MEMO-${Date.now()}`;
  };
  
  const generateMemoData = (customer, products, deposit) => {
    return {
      memoNumber: generateMemoNumber(),
      date: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      products,
      total: products.reduce((sum, p) => sum + p.total, 0),
      deposit,
      due: products.reduce((sum, p) => sum + p.total, 0) - deposit,
    };
  };
  
  return { generateMemoNumber, generateMemoData };
}
```

---

## Implementation Priority

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Standardize "quantity" naming (find & replace)
2. ✅ Extract `useCartCalculations` hook
3. ✅ Create validation utilities

### Phase 2: Component Extraction (2-3 hours)
1. ✅ Extract `CustomerSelection` component
2. ✅ Extract `ProductEntryForm` component
3. ✅ Extract `ProductList` component
4. ✅ Refactor main CashMemo page

### Phase 3: Dynamic Stores (3-4 hours)
1. ✅ Create stores collection in Firebase
2. ✅ Create store service and hook
3. ✅ Create `StoreSelect` component
4. ✅ Replace all hardcoded store selects

---

## Testing Checklist

After each phase:

- [ ] All pages load correctly
- [ ] No console errors
- [ ] All CRUD operations work
- [ ] Calculations are correct
- [ ] Validation works
- [ ] UI looks the same
- [ ] Performance is maintained

---

## Benefits Summary

### Code Quality
- ✅ Smaller, focused components (<300 lines each)
- ✅ Reusable components across the app
- ✅ Easier to test and maintain
- ✅ Better separation of concerns

### Scalability
- ✅ Easy to add new stores dynamically
- ✅ Easy to add new features
- ✅ Easy to modify calculations
- ✅ Easy to change UI without touching logic

### Developer Experience
- ✅ Easier to understand code
- ✅ Faster to make changes
- ✅ Less code duplication
- ✅ Better code organization

---

**Priority**: MEDIUM
**Impact**: HIGH (Better maintainability)
**Effort**: MEDIUM (6-9 hours total)
**Risk**: LOW (Can be done incrementally)
