import { useState } from "react";
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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supplierTransactionSchema } from "@/lib/schemas";

export function AddSupplierTransactionDialog({ supplierId, onAddTransaction }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierTransactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      invoiceNumber: "",
      details: "",
      totalAmount: 0,
      paidAmount: 0,
    },
  });

  const onSubmit = async (data) => {
    try {
      const transaction = {
        ...data,
        supplierId,
        totalAmount: parseFloat(data.totalAmount) || 0,
        paidAmount: parseFloat(data.paidAmount) || 0,
        due:
          (parseFloat(data.totalAmount) || 0) -
            (parseFloat(data.paidAmount) || 0),
        createdAt: new Date().toISOString(),
      };

      await onAddTransaction(transaction);
      setOpen(false);
      reset(); // Reset form state
    } catch (error) {
      // Typically errors are handled by React Query mutation but we can set generic here
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset(); // ensure clean slate
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Transaction</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Supplier Transaction</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
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
                placeholder="Enter invoice number"
              />
              {errors.invoiceNumber && (
                <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Details</label>
              <Input
                {...register("details")}
                placeholder="Enter transaction details"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Total Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("totalAmount")}
                  className={errors.totalAmount ? "border-red-500" : ""}
                  placeholder="Enter total amount"
                />
                {errors.totalAmount && (
                  <p className="text-sm text-red-500">{errors.totalAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paid Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("paidAmount")}
                  className={errors.paidAmount ? "border-red-500" : ""}
                  placeholder="Enter paid amount"
                />
                {errors.paidAmount && (
                  <p className="text-sm text-red-500">{errors.paidAmount.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
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
                     Adding...
                  </>
                ) : (
                  "Add Transaction"
                )}
              </Button>
            </div>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
