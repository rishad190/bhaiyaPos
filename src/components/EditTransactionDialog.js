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

export function EditTransactionDialog({ transaction, onEditTransaction }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: transaction.date,
    memoNumber: transaction.memoNumber,
    details: transaction.details || "",
    total: transaction.total.toString(),
    deposit: transaction.deposit.toString(),
    storeId: transaction.storeId,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Required field validations
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.memoNumber) newErrors.memoNumber = "Memo number is required";

    // Total amount validation (optional but must be valid if provided)
    if (formData.total && formData.total.trim() !== "") {
      const totalAmount = parseFloat(formData.total);
      if (isNaN(totalAmount)) {
        newErrors.total = "Please enter a valid amount";
      } else if (totalAmount < 0) {
        newErrors.total = "Amount cannot be negative";
      }
    }

    // Deposit amount validation
    if (formData.deposit && formData.deposit.trim() !== "") {
      const depositAmount = parseFloat(formData.deposit);
      if (isNaN(depositAmount)) {
        newErrors.deposit = "Please enter a valid amount";
      } else if (depositAmount < 0) {
        newErrors.deposit = "Deposit cannot be negative";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const totalAmount = formData.total ? parseFloat(formData.total) : 0;
      const depositAmount = formData.deposit ? parseFloat(formData.deposit) : 0;

      const updatedTransaction = {
        ...transaction,
        ...formData,
        total: totalAmount,
        deposit: depositAmount,
        due: totalAmount - depositAmount,
      };

      await onEditTransaction(updatedTransaction);
      setOpen(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      setErrors({ submit: "Failed to update transaction. Please try again." });
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
          <DialogTitle>Edit Transaction</DialogTitle>
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
