"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import logger from "@/utils/logger";
import { STORES } from "@/lib/constants";
import { transactionSchema } from "@/lib/schemas";

export function EditTransactionDialog({
  transaction,
  onEditTransaction,
  customerName,
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString) => {
    if (!dateString) return new Date().toISOString().split("T")[0];
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().split("T")[0];
    return date.toISOString().split("T")[0];
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: formatDateForInput(transaction?.date),
      memoNumber: transaction?.memoNumber || "",
      details: transaction?.details || "",
      total: transaction?.total || 0,
      deposit: transaction?.deposit || 0,
      storeId: transaction?.storeId || "STORE1",
    },
  });

  // Update form values when transaction changes
  useEffect(() => {
    if (transaction) {
      reset({
        date: formatDateForInput(transaction.date),
        memoNumber: transaction.memoNumber || "",
        details: transaction.details || "",
        total: transaction.total || 0,
        deposit: transaction.deposit || 0,
        storeId: transaction.storeId || "STORE1",
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data) => {
    try {
      // Sanitize and validate data before submission
      // Zod has already validated types, but we calculate due here
      const totalAmount = data.total;
      const depositAmount = data.deposit;

      const sanitizedData = {
        date: data.date,
        memoNumber: data.memoNumber.trim(),
        details: data.details?.trim() || "",
        total: totalAmount,
        deposit: depositAmount,
        due: totalAmount - depositAmount,
        storeId: data.storeId,
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
      logger.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && transaction) {
      // Reset again to ensure fresh data if it changed while closed
      reset({
        date: formatDateForInput(transaction.date),
        memoNumber: transaction.memoNumber || "",
        details: transaction.details || "",
        total: transaction.total || 0,
        deposit: transaction.deposit || 0,
        storeId: transaction.storeId || "STORE1",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                {...register("date")}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Memo Number *</label>
              <Input
                placeholder="Enter memo number"
                {...register("memoNumber")}
                className={errors.memoNumber ? "border-red-500" : ""}
              />
              {errors.memoNumber && (
                <p className="text-red-500 text-sm">{errors.memoNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Details</label>
              <Input
                placeholder="Enter transaction details"
                {...register("details")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Bill</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total amount"
                {...register("total")}
                className={errors.total ? "border-red-500" : ""}
              />
              {errors.total && (
                <p className="text-red-500 text-sm">{errors.total.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter deposit amount"
                {...register("deposit")}
                className={errors.deposit ? "border-red-500" : ""}
              />
              {errors.deposit && (
                <p className="text-red-500 text-sm">{errors.deposit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Store</label>
              <select
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.storeId ? "border-red-500" : ""
                }`}
                {...register("storeId")}
                disabled={isSubmitting}
              >
                {STORES.map((store) => (
                  <option key={store.value} value={store.value}>
                    {store.label}
                  </option>
                ))}
              </select>
              {errors.storeId && (
                <p className="text-red-500 text-sm">{errors.storeId.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
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
