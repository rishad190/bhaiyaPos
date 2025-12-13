"use client";
import { useState, useEffect } from "react";
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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supplierTransactionSchema } from "@/lib/schemas";

export function EditSupplierTransactionDialog({ transaction, onSave }) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierTransactionSchema),
    defaultValues: {
      date: "",
      invoiceNumber: "",
      details: "",
      totalAmount: 0,
      paidAmount: 0,
    },
  });

  useEffect(() => {
    if (transaction) {
      reset({
        date: transaction.date || "",
        invoiceNumber: transaction.invoiceNumber || "",
        details: transaction.details || "",
        totalAmount: transaction.totalAmount || 0,
        paidAmount: transaction.paidAmount || 0,
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data) => {
    try {
      const updatedTransaction = {
        ...data,
        totalAmount: parseFloat(data.totalAmount) || 0,
        paidAmount: parseFloat(data.paidAmount) || 0,
        due:
          (parseFloat(data.totalAmount) || 0) -
          (parseFloat(data.paidAmount) || 0),
        updatedAt: new Date().toISOString(),
      };
      await onSave(transaction.id, updatedTransaction);
      setOpen(false);
    } catch (error) {
       // generic handling
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && transaction) {
      reset({
        date: transaction.date || "",
        invoiceNumber: transaction.invoiceNumber || "",
        details: transaction.details || "",
        totalAmount: transaction.totalAmount || 0,
        paidAmount: transaction.paidAmount || 0,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
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
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Invoice Number *</label>
              <Input
                {...register("invoiceNumber")}
                className={errors.invoiceNumber ? "border-red-500" : ""}
              />
              {errors.invoiceNumber && (
                <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Details</label>
              <Input
                {...register("details")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Total Amount *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register("totalAmount")}
                className={errors.totalAmount ? "border-red-500" : ""}
              />
              {errors.totalAmount && (
                <p className="text-sm text-red-500">{errors.totalAmount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Paid Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register("paidAmount")}
                className={errors.paidAmount ? "border-red-500" : ""}
              />
              {errors.paidAmount && (
                <p className="text-sm text-red-500">{errors.paidAmount.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
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
                     Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
