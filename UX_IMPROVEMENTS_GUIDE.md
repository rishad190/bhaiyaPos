# UX Improvements Guide - Replace Alerts with Toasts

## Problem

The application currently uses blocking `alert()` and `window.confirm()` dialogs in several places, which provide a poor user experience:

- ❌ Blocks the entire UI
- ❌ Looks outdated and unprofessional
- ❌ Inconsistent with the rest of the app
- ❌ Cannot be styled or customized
- ❌ Interrupts user workflow

## Solution

Replace all `alert()` and `window.confirm()` with:
- ✅ Toast notifications (for alerts)
- ✅ Confirmation dialogs (for confirms)

## Installation

First, install the required package:

```bash
npm install @radix-ui/react-alert-dialog
```

## Files Created

1. `src/components/ui/alert-dialog.jsx` - Radix UI alert dialog component
2. `src/hooks/useConfirm.js` - Custom hook for confirmation dialogs
3. `src/components/ConfirmDialog.js` - Reusable confirmation dialog component

## Replacement Guide

### 1. Replace `alert()` with Toast

#### Before (Bad UX)
```javascript
if (!formData.name) {
  alert("Name is required!");
  return;
}

try {
  await saveData();
} catch (error) {
  alert("Failed to save. Please try again.");
}
```

#### After (Good UX)
```javascript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

if (!formData.name) {
  toast({
    title: "Validation Error",
    description: "Name is required!",
    variant: "destructive",
  });
  return;
}

try {
  await saveData();
} catch (error) {
  toast({
    title: "Error",
    description: "Failed to save. Please try again.",
    variant: "destructive",
  });
}
```

### 2. Replace `window.confirm()` with ConfirmDialog

#### Before (Bad UX)
```javascript
const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this item?")) {
    return;
  }
  
  await deleteItem(id);
};
```

#### After (Good UX)
```javascript
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

const handleDelete = async (id) => {
  try {
    await confirm({
      title: "Delete Item",
      description: "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    
    // User confirmed
    await deleteItem(id);
    
    toast({
      title: "Success",
      description: "Item deleted successfully",
    });
  } catch {
    // User cancelled - do nothing
  }
};

// In JSX
return (
  <>
    {/* Your component content */}
    <ConfirmDialog
      isOpen={isOpen}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      config={config}
    />
  </>
);
```

## Files to Update

### High Priority (User-Facing)

1. **src/components/PurchaseStockDialog.js**
   - 3 alerts to replace
   - Validation errors and save errors

2. **src/components/AddCustomerDialog.js**
   - 2 alerts to replace
   - Validation and save errors

3. **src/components/AddCashTransactionDialog.js**
   - 2 alerts to replace
   - Validation and save errors

4. **src/components/EditFabricDialog.js**
   - 3 alerts + 1 confirm to replace
   - Validation, save, and delete confirmation

5. **src/components/AddFabricDialog.js**
   - 2 alerts to replace
   - Validation and save errors

### Medium Priority (Admin Actions)

6. **src/app/suppliers/page.js**
   - 1 confirm to replace
   - Delete supplier confirmation

7. **src/app/inventory/page.js**
   - 1 confirm to replace
   - Delete fabric confirmation

8. **src/app/customers/page.js**
   - 1 confirm to replace
   - Delete customer confirmation

9. **src/app/cashbook/page.js**
   - 1 confirm to replace
   - Delete transaction confirmation

### Low Priority (Utility Functions)

10. **src/utils/export.js**
    - 2 alerts to replace
    - Export error messages

## Example Implementations

### Example 1: Validation Alert

```javascript
// src/components/PurchaseStockDialog.js

// OLD
if (!formData.fabricId || !formData.containerNo) {
  alert("Please fill in all required fields");
  return;
}

// NEW
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

if (!formData.fabricId || !formData.containerNo) {
  toast({
    title: "Validation Error",
    description: "Please fill in all required fields",
    variant: "destructive",
  });
  return;
}
```

### Example 2: Error Alert

```javascript
// src/components/AddCustomerDialog.js

// OLD
try {
  await addCustomer(formData);
} catch (error) {
  alert("Failed to add customer. Please try again.");
}

// NEW
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

try {
  await addCustomer(formData);
  toast({
    title: "Success",
    description: "Customer added successfully",
  });
} catch (error) {
  toast({
    title: "Error",
    description: "Failed to add customer. Please try again.",
    variant: "destructive",
  });
}
```

### Example 3: Delete Confirmation

```javascript
// src/app/customers/page.js

// OLD
const handleDeleteCustomer = async (customerId) => {
  if (window.confirm("Are you sure you want to delete this customer?")) {
    await deleteCustomerMutation.mutateAsync(customerId);
  }
};

// NEW
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const { confirm, isOpen, config, handleConfirm, handleCancel } = useConfirm();

const handleDeleteCustomer = async (customerId) => {
  try {
    await confirm({
      title: "Delete Customer",
      description: "Are you sure you want to delete this customer? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    
    await deleteCustomerMutation.mutateAsync(customerId);
  } catch {
    // User cancelled
  }
};

// Add to JSX
<ConfirmDialog
  isOpen={isOpen}
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  config={config}
/>
```

## Toast Variants

```javascript
// Success (default)
toast({
  title: "Success",
  description: "Operation completed successfully",
});

// Error
toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive",
});

// Warning
toast({
  title: "Warning",
  description: "Please review your input",
  variant: "warning", // if supported
});

// Info
toast({
  title: "Info",
  description: "Here's some information",
});
```

## Confirmation Dialog Variants

```javascript
// Destructive action (delete, remove, etc.)
await confirm({
  title: "Delete Item",
  description: "This action cannot be undone.",
  confirmText: "Delete",
  cancelText: "Cancel",
  variant: "destructive",
});

// Regular confirmation
await confirm({
  title: "Save Changes",
  description: "Do you want to save your changes?",
  confirmText: "Save",
  cancelText: "Cancel",
  variant: "default",
});

// Warning confirmation
await confirm({
  title: "Proceed with Caution",
  description: "This action may have side effects.",
  confirmText: "Proceed",
  cancelText: "Cancel",
  variant: "warning",
});
```

## Benefits

### User Experience
- ✅ Non-blocking notifications
- ✅ Professional appearance
- ✅ Consistent with app design
- ✅ Customizable styling
- ✅ Better accessibility

### Developer Experience
- ✅ Reusable components
- ✅ Type-safe with TypeScript
- ✅ Easy to test
- ✅ Centralized error handling
- ✅ Better code organization

## Testing Checklist

After replacing alerts/confirms:

- [ ] Validation errors show toast notifications
- [ ] Save errors show toast notifications
- [ ] Delete confirmations show dialog
- [ ] Confirmations can be cancelled
- [ ] Toasts auto-dismiss after timeout
- [ ] Multiple toasts stack properly
- [ ] Keyboard navigation works (Esc to close)
- [ ] Screen readers announce toasts
- [ ] Mobile experience is good

## Migration Priority

1. **Phase 1** (High Impact): User-facing dialogs
   - PurchaseStockDialog
   - AddCustomerDialog
   - AddCashTransactionDialog
   - EditFabricDialog
   - AddFabricDialog

2. **Phase 2** (Medium Impact): Admin actions
   - Delete confirmations in all pages
   - Bulk action confirmations

3. **Phase 3** (Low Impact): Utility functions
   - Export error messages
   - Background operation notifications

## Estimated Time

- Setup (install package, create components): 15 minutes
- Phase 1 (5 files): 30 minutes
- Phase 2 (4 files): 20 minutes
- Phase 3 (1 file): 10 minutes
- Testing: 15 minutes

**Total**: ~90 minutes

## Notes

- The `useToast` hook is already available in the project
- Toast notifications are already styled and working
- The ConfirmDialog component is reusable across the entire app
- No database changes required
- Backward compatible (can migrate gradually)

---

**Priority**: MEDIUM
**Impact**: HIGH (Better UX)
**Effort**: LOW (Simple replacements)
**Risk**: VERY LOW (No breaking changes)
