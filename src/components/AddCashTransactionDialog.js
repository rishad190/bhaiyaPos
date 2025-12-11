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
import { Input } from "@/components/ui/input";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { cashTransactionSchema } from "@/lib/schemas";

export function AddCashTransactionDialog({ onAddTransaction, children }) {
  const [open, setOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(cashTransactionSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      cashIn: "",
      cashOut: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await onAddTransaction({
        ...data,
        cashIn: parseFloat(data.cashIn) || 0,
        cashOut: parseFloat(data.cashOut) || 0,
      });
      setOpen(false);
      reset();
    } catch (error) {
      logger.error("Error adding transaction:", error);
      // alert("Failed to add transaction. Please try again."); // Removed alert in favor of toast if available, or just log for now as per pattern
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Cash Transaction</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-red-500 text-sm">{errors.date.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Enter transaction description"
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                {...register("reference")}
                placeholder="Enter reference number"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cashIn">Cash In</Label>
                <Input
                  id="cashIn"
                  type="number"
                  {...register("cashIn")}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors.cashIn ? "border-red-500" : ""}
                />
                {errors.cashIn && (
                  <p className="text-red-500 text-sm">{errors.cashIn.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cashOut">Cash Out</Label>
                <Input
                  id="cashOut"
                  type="number"
                  {...register("cashOut")}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors.cashOut ? "border-red-500" : ""}
                />
              </div>
            </div>
            
            {/* Show global error from refinement if any */}
            {(errors.root || errors.cashIn?.type === "custom") && (
               /* Note: Zod refine error might attach to path, handled above if attached to cashIn */
               null
            )}

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
