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

import { Loader2 } from "lucide-react";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { useToast } from "@/hooks/use-toast";

export function EditTransactionDialog({
  transaction,
  onEditTransaction,
  customerName,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split("T")[0];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  // Initialize formData with proper null checks and defaults
  const [formData, setFormData] = useState(() => ({
    date: formatDateForInput(transaction?.date),
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

    // Validate date is not in the future
    const selectedDate = new Date(formData.date);
    const today = new Date();
    if (selectedDate > today) {
      newErrors.date = "Date cannot be in the future";
    }

    // Explicit trim check for memo number
    const trimmedMemo = formData.memoNumber?.trim();
    if (!trimmedMemo) {
      newErrors.memoNumber = "Memo number is required";
    }

    // Amount validations with better type checking

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Sanitize and validate data before submission
      const totalAmount = parseFloat(formData.total);
      const depositAmount = parseFloat(formData.deposit);

      if (isNaN(totalAmount) || isNaN(depositAmount)) {
        throw new Error("Invalid amount values");
      }

      const sanitizedData = {
        date: formData.date,
        memoNumber: formData.memoNumber.trim(),
        details: formData.details.trim(),
        total: totalAmount,
        deposit: depositAmount,
        due: totalAmount - depositAmount,
        storeId: formData.storeId,
        customerId: transaction.customerId,
        id: transaction.id,
        updatedAt: new Date().toISOString(),
      };

      await onEditTransaction(sanitizedData);
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction for {customerName}</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className={errors.date ? "border-red-500" : ""}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Memo Number *</label>
            <Input
              name="memoNumber"
              placeholder="Enter memo number"
              value={formData.memoNumber}
              onChange={handleInputChange}
              className={errors.memoNumber ? "border-red-500" : ""}
            />
            {errors.memoNumber && (
              <p className="text-red-500 text-sm">{errors.memoNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Details</label>
            <Input
              name="details"
              placeholder="Enter transaction details"
              value={formData.details}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Total Bill</label>
            <Input
              name="total"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter total amount"
              value={formData.total}
              onChange={handleInputChange}
              className={errors.total ? "border-red-500" : ""}
            />
            {errors.total && (
              <p className="text-red-500 text-sm">{errors.total}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deposit</label>
            <Input
              name="deposit"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter deposit amount"
              value={formData.deposit}
              onChange={handleInputChange}
              className={errors.deposit ? "border-red-500" : ""}
            />
            {errors.deposit && (
              <p className="text-red-500 text-sm">{errors.deposit}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Store</label>
            <select
              name="storeId"
              className={`w-full border rounded-md px-3 py-2 ${
                errors.storeId ? "border-red-500" : ""
              }`}
              value={formData.storeId}
              onChange={handleInputChange}
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
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Transaction"
              )}
            </Button>
          </div>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
