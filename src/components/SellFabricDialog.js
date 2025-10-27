import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SellFabricDialog({ fabric, onSellFabric }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [color, setColor] = useState(null);
  const [error, setError] = useState("");
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    if (fabric && fabric.batches) {
      const colors = fabric.batches.reduce((acc, batch) => {
        if (batch.colors && batch.colors.length > 0) {
          batch.colors.forEach(c => {
            if (!acc.find(ac => ac.color === c.color)) {
              acc.push({ color: c.color, quantity: 0 });
            }
            const existingColor = acc.find(ac => ac.color === c.color);
            existingColor.quantity += c.quantity;
          });
        } else if (batch.color) {
          if (!acc.find(ac => ac.color === batch.color)) {
            acc.push({ color: batch.color, quantity: 0 });
          }
          const existingColor = acc.find(ac => ac.color === batch.color);
          existingColor.quantity += batch.quantity;
        }
        return acc;
      }, []);
      setAvailableColors(colors);
    }
  }, [fabric]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const sellQuantity = parseFloat(quantity);
    if (isNaN(sellQuantity) || sellQuantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    const availableQty = color ? availableColors.find(c => c.color === color)?.quantity : fabric.totalQuantity;

    if (sellQuantity > availableQty) {
      setError("Insufficient stock available");
      return;
    }

    try {
      // Check how many arguments onSellFabric expects
      if (onSellFabric.length === 2) {
        await onSellFabric(fabric.id, sellQuantity, color);
      } else {
        await onSellFabric(sellQuantity, color);
      }
      setOpen(false);
      setQuantity("");
      setColor(null);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Sell
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell Fabric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h4 className="font-medium">{fabric.name}</h4>
            <p className="text-sm text-gray-500">
              Available: {fabric.totalQuantity}
            </p>
          </div>
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <Select onValueChange={setColor} value={color}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {availableColors.map((c) => (
                    <SelectItem key={c.color} value={c.color}>
                      {c.color} ({c.quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max={color ? availableColors.find(c => c.color === color)?.quantity : fabric.totalQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity to sell"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Sell</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}