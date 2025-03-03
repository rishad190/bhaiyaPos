"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function EditTransactionDialog({
  transaction,
  onEditTransaction,
  customerName,
}) {
  const [open, setOpen] = useState(false);

  // Initialize formData with proper null checks and defaults
  const [formData, setFormData] = useState(() => ({
    date: transaction?.date || new Date().toISOString().split("T")[0],
    memoNumber: transaction?.memoNumber || "",
    details: transaction?.details || "",
    total:
      typeof transaction?.total === "number"
        ? transaction.total.toString()
        : "0",
    deposit:
      typeof transaction?.deposit === "number"
        ? transaction.deposit.toString()
        : "0",
    storeId: transaction?.storeId || "STORE1",
    customerId: transaction?.customerId || "",
  }));

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Required field validations with proper trim checks
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    // Explicit trim check for memo number
    const trimmedMemo = formData.memoNumber?.trim();
    if (!trimmedMemo) {
      newErrors.memoNumber = "Memo number is required";
    }

    // Amount validations with better type checking
    const totalAmount = parseFloat(formData.total);
    const depositAmount = parseFloat(formData.deposit);

    if (isNaN(totalAmount) || totalAmount < 0) {
      newErrors.total = "Please enter a valid amount";
    }

    if (isNaN(depositAmount) || depositAmount < 0) {
      newErrors.deposit = "Please enter a valid deposit amount";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      // Sanitize and validate data before submission
      const totalAmount = parseFloat(formData.total);
      const depositAmount = parseFloat(formData.deposit);

      if (isNaN(totalAmount) || isNaN(depositAmount)) {
        throw new Error("Invalid amount values");
      }

      const sanitizedData = {
        date: formData.date,
        memoNumber: formData.memoNumber.trim() || transaction.memoNumber, // Fallback to original
        details: formData.details.trim(),
        total: totalAmount,
        deposit: depositAmount,
        due: totalAmount - depositAmount,
        storeId: formData.storeId,
        customerId: transaction.customerId,
        id: transaction.id,
        updatedAt: new Date().toISOString(),
      };

      // Additional validation
      if (!sanitizedData.memoNumber) {
        throw new Error("Memo number is required");
      }

      await onEditTransaction(sanitizedData);
      setOpen(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setErrors({
        submit:
          error.message || "Failed to update transaction. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction for {customerName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className={errors.date ? "border-red-500" : ""}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Memo Number *</label>
            <Input
              placeholder="Enter memo number"
              value={formData.memoNumber}
              onChange={(e) =>
                setFormData({ ...formData, memoNumber: e.target.value })
              }
              className={errors.memoNumber ? "border-red-500" : ""}
            />
            {errors.memoNumber && (
              <p className="text-red-500 text-sm">{errors.memoNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details</label>
            <Input
              placeholder="Enter transaction details"
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Bill</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter total amount"
              value={formData.total}
              onChange={(e) =>
                setFormData({ ...formData, total: e.target.value })
              }
              className={errors.total ? "border-red-500" : ""}
            />
            {errors.total && (
              <p className="text-red-500 text-sm">{errors.total}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deposit</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter deposit amount"
              value={formData.deposit}
              onChange={(e) =>
                setFormData({ ...formData, deposit: e.target.value })
              }
              className={errors.deposit ? "border-red-500" : ""}
            />
            {errors.deposit && (
              <p className="text-red-500 text-sm">{errors.deposit}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Store</label>
            <select
              className={`w-full border rounded-md px-3 py-2 ${
                errors.storeId ? "border-red-500" : ""
              }`}
              value={formData.storeId}
              onChange={(e) =>
                setFormData({ ...formData, storeId: e.target.value })
              }
            >
              <option value="STORE1">Store 1</option>
              <option value="STORE2">Store 2</option>
            </select>
            {errors.storeId && (
              <p className="text-red-500 text-sm">{errors.storeId}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update Transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
