"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { STORES, DEFAULT_STORE } from "@/lib/constants";
import { transactionSchema } from "@/lib/schemas";

export function AddTransactionDialog({ customerId, onAddTransaction }) {
  const [open, setOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      memoNumber: "",
      details: "",
      total: "",
      deposit: "",
      storeId: DEFAULT_STORE,
    },
  });

  const onSubmit = async (data) => {
    try {
      const newTransaction = {
        ...data,
        memoNumber: data.memoNumber?.trim() || "",
        customerId,
        // Numbers are already coerced by Zod, but let's be safe with calculation
        due: (data.total || 0) - (data.deposit || 0),
        createdAt: new Date().toISOString(),
      };

      await onAddTransaction(newTransaction);
      setOpen(false);
      reset(); // Reset form to default values
    } catch (error) {
      logger.error("Error submitting transaction:", error);
      // We could set a form-level error here if needed, but for now logger is enough
      // typically react-hook-form uses setError('root', ...)
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset(); // Reset form when dialog is closed/cancelled manually
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="Add new transaction">Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                {...register("date")}
                aria-label="Transaction date"
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Memo Number *</label>
              <Input
                aria-label="Memo number"
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
                aria-label="Transaction details"
                {...register("details")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Bill *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                aria-label="Total bill amount"
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
                aria-label="Deposit amount"
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
                aria-label="Select store"
                {...register("storeId")}
                disabled={isSubmitting}
                className="w-full border rounded-md px-3 py-2"
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
                aria-label="Cancel adding new transaction"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" aria-label="Save new transaction" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Transaction"
                )}
              </Button>
            </div>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
