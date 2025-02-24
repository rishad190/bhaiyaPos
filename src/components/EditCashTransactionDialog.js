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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function EditCashTransactionDialog({ transaction, onEditTransaction }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: transaction.date,
    description: transaction.description,
    amount: transaction.cashIn || transaction.cashOut,
    transactionType: transaction.cashIn > 0 ? "cashIn" : "cashOut",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    onEditTransaction({
      ...transaction,
      date: formData.date,
      description: formData.description,
      cashIn: formData.transactionType === "cashIn" ? amount : 0,
      cashOut: formData.transactionType === "cashOut" ? amount : 0,
    });
    setOpen(false);
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
          {/* ... same form fields as AddCashTransactionDialog ... */}
          <RadioGroup
            value={formData.transactionType}
            onValueChange={(value) =>
              setFormData({ ...formData, transactionType: value })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cashIn" id="edit-cashIn" />
              <Label htmlFor="edit-cashIn" className="text-green-600">
                Cash In
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cashOut" id="edit-cashOut" />
              <Label htmlFor="edit-cashOut" className="text-red-600">
                Cash Out
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Input
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Enter amount (${
                formData.transactionType === "cashIn" ? "Received" : "Paid"
              })`}
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
