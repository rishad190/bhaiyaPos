"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditCashTransactionDialog({
  transaction,
  onEditTransaction,
  open,
  onOpenChange,
}) {
  const [formData, setFormData] = useState({
    date: transaction.date,
    description: transaction.description,
    cashIn: transaction.cashIn || 0,
    cashOut: transaction.cashOut || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEditTransaction(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashIn">Cash In</Label>
              <Input
                id="cashIn"
                type="number"
                value={formData.cashIn}
                onChange={(e) =>
                  setFormData({ ...formData, cashIn: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cashOut">Cash Out</Label>
              <Input
                id="cashOut"
                type="number"
                value={formData.cashOut}
                onChange={(e) =>
                  setFormData({ ...formData, cashOut: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
