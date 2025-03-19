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
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function AddCashTransactionDialog({ onAddTransaction, children }) {
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("cashIn");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const amount = parseFloat(formData.amount) || 0;
      await onAddTransaction({
        ...formData,
        cashIn: transactionType === "cashIn" ? amount : 0,
        cashOut: transactionType === "cashOut" ? amount : 0,
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ submit: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
    });
    setTransactionType("cashIn");
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Record Cash Movement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={transactionType === "cashIn" ? "default" : "outline"}
              onClick={() => setTransactionType("cashIn")}
              className={`h-24 flex flex-col items-center justify-center gap-2 ${
                transactionType === "cashIn"
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : ""
              }`}
            >
              <ArrowUpRight
                className={`h-6 w-6 ${
                  transactionType === "cashIn"
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <span>Cash In</span>
            </Button>
            <Button
              type="button"
              variant={transactionType === "cashOut" ? "default" : "outline"}
              onClick={() => setTransactionType("cashOut")}
              className={`h-24 flex flex-col items-center justify-center gap-2 ${
                transactionType === "cashOut"
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : ""
              }`}
            >
              <ArrowDownRight
                className={`h-6 w-6 ${
                  transactionType === "cashOut"
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
              />
              <span>Cash Out</span>
            </Button>
          </div>

          <div className="space-y-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={`${errors.date ? "border-red-500" : ""}`}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Description Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Description
              </Label>
              <Input
                placeholder="Enter transaction description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`${errors.description ? "border-red-500" : ""}`}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Amount
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ৳
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className={`pl-8 ${errors.amount ? "border-red-500" : ""}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount}</p>
              )}
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="w-24"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`w-32 ${
                transactionType === "cashIn"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Record {transactionType === "cashIn" ? "Cash In" : "Cash Out"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
