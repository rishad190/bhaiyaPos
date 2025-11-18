# 🎯 Code Quality Improvements Plan

## Overview
Systematic refactoring to improve code quality, maintainability, and scalability.

---

## Phase 1: Quick Wins (Immediate) ⚡

### 1.1 Standardize "Quantity" Naming ✅
**Problem**: Inconsistent use of "quality" instead of "quantity"
**Action**: Global search and replace
**Files to update**:
- src/components/CashMemoPrint.js
- src/app/cashmemo/page.js
- Any other files with "quality" typo

**Impact**: Low effort, high clarity

---

## Phase 2: Modularize Cash Memo Page (High Priority) 🧩

### 2.1 Extract Custom Hooks

#### `src/hooks/useCartCalculations.js`
**Purpose**: Centralize cart calculations
**Exports**:
- `useCartCalculations(products)` → { grandTotal, totalCost, totalProfit }

**Benefits**:
- Memoized calculations
- Reusable logic
- Easier testing

#### `src/hooks/useMemoGeneration.js`
**Purpose**: Generate memo numbers and structure transaction payload
**Exports**:
- `useMemoGeneration()` → { generateMemoNumber, createTransactionPayload }

**Benefits**:
- Centralized memo logic
- Consistent memo number format
- Easier to modify

### 2.2 Extract Components

#### `src/components/cashmemo/CustomerSelection.js`
**Purpose**: Customer search and selection
**Props**:
- `customers: Customer[]`
- `selectedCustomerId: string`
- `onCustomerSelect: (customer) => void`

**Features**:
- Search by phone/name
- Popover UI
- Customer details display

**Size**: ~150 lines

#### `src/components/cashmemo/ProductEntryForm.js`
**Purpose**: Product selection and entry
**Props**:
- `fabrics: Fabric[]`
- `onAddProduct: (product) => void`

**Features**:
- Product search
- Color selection
- Quantity/price input
- Validation
- FIFO cost calculation

**Size**: ~200 lines

#### `src/components/cashmemo/ProductList.js`
**Purpose**: Display added products
**Props**:
- `products: Product[]`
- `onRemoveProduct: (index) => void`
- `onUpdateProduct: (index, product) => void`

**Features**:
- Product table
- Edit/remove actions
- Totals display

**Size**: ~150 lines

#### `src/components/cashmemo/MemoSummary.js`
**Purpose**: Display memo summary and totals
**Props**:
- `grandTotal: number`
- `totalCost: number`
- `totalProfit: number`
- `deposit: number`
- `due: number`

**Features**:
- Summary cards
- Formatted currency
- Profit calculation

**Size**: ~100 lines

### 2.3 Extract Validation Logic

#### `src/lib/validations/cashMemoValidation.js`
**Purpose**: Centralize validation logic
**Exports**:
- `validateCustomer(customer)` → { valid, errors }
- `validateProduct(product)` → { valid, errors }
- `validateMemo(memo)` → { valid, errors }

**Benefits**:
- Reusable validation
- Consistent error messages
- Easier testing

### 2.4 Result
**Before**: 1200+ lines in one file
**After**: 
- Main page: ~300 lines
- 4 components: ~600 lines
- 2 hooks: ~200 lines
- 1 validation file: ~100 lines

**Total**: Same code, better organized

---

## Phase 3: Centralize Store Constants (Medium Priority) 🏢

### 3.1 Create Stores Infrastructure

#### Firebase Collection
```javascript
// stores collection structure
{
  "store1": {
    id: "store1",
    name: "Main Store",
    address: "123 Main St",
    phone: "123-456-7890",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  "store2": {
    id: "store2",
    name: "Branch Store",
    address: "456 Oak Ave",
    phone: "098-765-4321",
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

#### `src/services/storeService.js`
**Purpose**: Firebase operations for stores
**Exports**:
- `getStores()` → Promise<Store[]>
- `getActiveStores()` → Promise<Store[]>
- `addStore(store)` → Promise<string>
- `updateStore(id, store)` → Promise<void>
- `deleteStore(id)` → Promise<void>

#### `src/hooks/useStores.js`
**Purpose**: React Query hook for stores
**Exports**:
- `useStores()` → { data, isLoading, isError }
- `useActiveStores()` → { data, isLoading, isError }
- `useAddStore()` → mutation
- `useUpdateStore()` → mutation
- `useDeleteStore()` → mutation

#### `src/components/StoreSelect.js`
**Purpose**: Reusable store selection component
**Props**:
- `value: string`
- `onChange: (storeId) => void`
- `onlyActive?: boolean`
- `placeholder?: string`

**Features**:
- Dropdown with store list
- Shows store name and address
- Filters active stores
- Loading state

### 3.2 Replace Hardcoded Store IDs

**Files to update** (~10 files):
- src/app/cashmemo/page.js
- src/components/AddCustomerDialog.js
- src/components/AddTransactionDialog.js
- src/components/AddSupplierTransactionDialog.js
- And others with "STORE1" hardcoded

**Before**:
```javascript
storeId: "STORE1" // Hardcoded
```

**After**:
```javascript
import { StoreSelect } from "@/components/StoreSelect";

<StoreSelect 
  value={storeId} 
  onChange={setStoreId}
  onlyActive={true}
/>
```

### 3.3 Benefits
- ✅ Dynamic store management
- ✅ No code changes for new stores
- ✅ Scalable to multiple stores
- ✅ Centralized store configuration

---

## Phase 4: Extract Formatting Utilities (Low Priority) ⚙️

### 4.1 Create Formatters File

#### `src/lib/formatters.js`
**Purpose**: Centralize display formatting
**Exports**:
- `formatCurrency(amount, currency = "৳")` → string
- `formatMemoNumber(number)` → string
- `formatDate(date, format = "DD-MM-YYYY")` → string
- `formatPhone(phone)` → string
- `formatPercentage(value)` → string

**Benefits**:
- Consistent formatting
- Reusable across app
- Easy to modify format

### 4.2 Update Existing Files
Replace inline formatting with imported functions

**Before**:
```javascript
const formatted = `৳${amount.toFixed(2)}`;
```

**After**:
```javascript
import { formatCurrency } from "@/lib/formatters";
const formatted = formatCurrency(amount);
```

---

## Implementation Order

### Week 1: Phase 1 (Quick Wins)
- [x] Standardize "quantity" naming
- [x] Test changes

### Week 2: Phase 2 (Cash Memo Refactor)
- [ ] Create useCartCalculations hook
- [ ] Create useMemoGeneration hook
- [ ] Create validation file
- [ ] Extract CustomerSelection component
- [ ] Extract ProductEntryForm component
- [ ] Extract ProductList component
- [ ] Extract MemoSummary component
- [ ] Update main CashMemoPage
- [ ] Test thoroughly

### Week 3: Phase 3 (Store Infrastructure)
- [ ] Create stores Firebase collection
- [ ] Create storeService
- [ ] Create useStores hook
- [ ] Create StoreSelect component
- [ ] Replace hardcoded store IDs
- [ ] Test store management

### Week 4: Phase 4 (Formatters)
- [ ] Create formatters file
- [ ] Update files to use formatters
- [ ] Test formatting consistency

---

## Success Metrics

### Code Quality
- **Before**: 1200+ line file
- **After**: Largest file < 400 lines
- **Improvement**: 66% reduction in file size

### Maintainability
- **Before**: Hard to find logic
- **After**: Clear separation of concerns
- **Improvement**: Easier onboarding

### Scalability
- **Before**: Hardcoded stores
- **After**: Dynamic store management
- **Improvement**: Multi-store ready

### Testing
- **Before**: Hard to test
- **After**: Easy to test individual pieces
- **Improvement**: Better test coverage

---

## Risk Mitigation

### Testing Strategy
1. Test each extracted component independently
2. Test hooks with React Testing Library
3. Integration tests for main page
4. Manual testing of full flow

### Rollback Plan
1. Keep original file as backup
2. Implement changes in feature branch
3. Thorough testing before merge
4. Can revert if issues found

### Gradual Migration
1. Extract one component at a time
2. Test after each extraction
3. Don't break existing functionality
4. Incremental improvements

---

## Documentation

### For Each Component
- [ ] JSDoc comments
- [ ] PropTypes or TypeScript
- [ ] Usage examples
- [ ] README if complex

### For Each Hook
- [ ] Purpose and usage
- [ ] Parameters and return values
- [ ] Examples
- [ ] Edge cases

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize phases** based on business needs
3. **Start with Phase 1** (quick wins)
4. **Iterate and improve** based on feedback

---

## Notes

- All changes maintain backward compatibility
- No breaking changes to existing functionality
- Focus on incremental improvements
- Can pause between phases if needed

**Let's build a better codebase! 🚀**
