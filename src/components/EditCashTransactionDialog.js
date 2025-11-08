"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function EditCashTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onEditTransaction,
}) {
  const [formData, setFormData] = useState({
    date: transaction.date,
    description: transaction.description,
    cashIn: transaction.cashIn || 0,
    cashOut: transaction.cashOut || 0,
  });

  const [transactionType, setTransactionType] = useState(
    transaction.cashIn > 0 ? "in" : "out"
  );

  useEffect(() => {
    setFormData({
      date: transaction.date,
      description: transaction.description,
      cashIn: transaction.cashIn || 0,
      cashOut: transaction.cashOut || 0,
    });
    setTransactionType(transaction.cashIn > 0 ? "in" : "out");
  }, [transaction]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedTransaction = {
      ...formData,
      cashIn: transactionType === "in" ? Number(formData.cashIn) : 0,
      cashOut: transactionType === "out" ? Number(formData.cashOut) : 0,
    };
    onEditTransaction(updatedTransaction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Edit Cash Transaction
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Update the transaction details below.
          </p>
        </DialogHeader>
        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={transactionType === "in" ? "default" : "outline"}
              onClick={() => setTransactionType("in")}
              className={`h-24 flex flex-col items-center justify-center gap-2 ${
                transactionType === "in"
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : ""
              }`}
            >
              <ArrowUpRight
                className={`h-6 w-6 ${
                  transactionType === "in" ? "text-green-600" : "text-gray-400"
                }`}
              />
              <span>Cash In</span>
            </Button>
            <Button
              type="button"
              variant={transactionType === "out" ? "default" : "outline"}
              onClick={() => setTransactionType("out")}
              className={`h-24 flex flex-col items-center justify-center gap-2 ${
                transactionType === "out"
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : ""
              }`}
            >
              <ArrowDownRight
                className={`h-6 w-6 ${
                  transactionType === "out" ? "text-red-600" : "text-gray-400"
                }`}
              />
              <span>Cash Out</span>
            </Button>
          </div>

          <div className="space-y-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ৳
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={
                    transactionType === "in"
                      ? formData.cashIn
                      : formData.cashOut
                  }
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (transactionType === "in") {
                      setFormData({ ...formData, cashIn: value, cashOut: 0 });
                    } else {
                      setFormData({ ...formData, cashOut: value, cashIn: 0 });
                    }
                  }}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-24"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`w-32 ${
                transactionType === "in"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Save Changes
            </Button>
          </div>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
