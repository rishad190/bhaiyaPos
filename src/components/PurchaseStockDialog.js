"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Package } from "lucide-react";
import logger from "@/utils/logger";

export function PurchaseStockDialog({
  fabrics = [],
  suppliers = [],
  onPurchaseStock,
  children,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fabricId: "",
    containerNo: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    costPerPiece: "",
    supplierId: "",
    items: [{ colorName: "", quantity: "" }],
  });

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { colorName: "", quantity: "" }],
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fabricId || !formData.containerNo || !formData.costPerPiece) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate items
    for (const item of formData.items) {
      if (!item.colorName || !item.quantity || parseFloat(item.quantity) <= 0) {
        alert("Please fill in all color items with valid quantities");
        return;
      }
    }

    setLoading(true);
    try {
      await onPurchaseStock({
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
        })),
      });
      setOpen(false);
      // Reset form
      setFormData({
        fabricId: "",
        containerNo: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        costPerPiece: "",
        supplierId: "",
        items: [{ colorName: "", quantity: "" }],
      });
    } catch (error) {
      logger.error("Error purchasing stock:", error);
      alert("Failed to purchase stock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedFabric = fabrics.find((f) => f.id === formData.fabricId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Package className="mr-2 h-4 w-4" />
            Purchase Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase New Stock</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fabric Selection */}
          <div className="space-y-2">
            <Label htmlFor="fabricId">Fabric *</Label>
            <Select
              value={formData.fabricId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, fabricId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabrics.map((fabric) => (
                  <SelectItem key={fabric.id} value={fabric.id}>
                    {fabric.name} ({fabric.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Container Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="containerNo">Container No. *</Label>
              <Input
                id="containerNo"
                value={formData.containerNo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    containerNo: e.target.value,
                  }))
                }
                placeholder="Enter container number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    purchaseDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Cost and Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPerPiece">Cost Per Piece (৳) *</Label>
              <Input
                id="costPerPiece"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerPiece}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    costPerPiece: e.target.value,
                  }))
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, supplierId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Supplier</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Color Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Color
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`color-${index}`}>Color Name</Label>
                  <Input
                    id={`color-${index}`}
                    value={item.colorName}
                    onChange={(e) =>
                      handleItemChange(index, "colorName", e.target.value)
                    }
                    placeholder="Enter color name"
                    required
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor={`quantity-${index}`}>
                    Quantity ({selectedFabric?.unit || "pieces"})
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="mt-6"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Purchasing..." : "Purchase Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
