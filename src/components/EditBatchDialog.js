
"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export function EditBatchDialog({ batch, fabric, onSave }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    unitCost: batch.unitCost,
    colors: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      let initialColors = [];
      if (Array.isArray(batch.colors) && batch.colors.length > 0) {
        initialColors = JSON.parse(JSON.stringify(batch.colors)); // Deep copy
      } else if (batch.color) {
        initialColors = [{ color: batch.color, quantity: batch.quantity }];
      }

      setFormData({
        unitCost: batch.unitCost,
        colors: initialColors,
      });
    }
  }, [open, batch]);

  const validate = () => {
    const newErrors = {};
    if (!formData.unitCost || formData.unitCost <= 0) {
      newErrors.unitCost = "Unit cost must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleColorChange = (index, field, value) => {
    const updatedColors = [...formData.colors];
    updatedColors[index] = { ...updatedColors[index], [field]: value };
    setFormData({ ...formData, colors: updatedColors });
  };

  const addColor = () => {
    setFormData({
      ...formData,
      colors: [...formData.colors, { color: "", quantity: 0 }],
    });
  };

  const removeColor = (index) => {
    const updatedColors = formData.colors.filter((_, i) => i !== index);
    setFormData({ ...formData, colors: updatedColors });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const totalQuantity = formData.colors.reduce(
      (sum, color) => sum + (Number(color.quantity) || 0),
      0
    );

    try {
      await onSave(batch.id, { ...formData, quantity: totalQuantity });
      setOpen(false);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) setErrors({});
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Batch Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Unit Cost *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  unitCost: parseFloat(e.target.value),
                })
              }
              className={errors.unitCost ? "border-red-500" : ""}
            />
            {errors.unitCost && (
              <p className="text-sm text-red-500">{errors.unitCost}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Colors</label>
            <div className="space-y-2">
              {formData.colors.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Color Name"
                    value={color.color}
                    onChange={(e) =>
                      handleColorChange(index, "color", e.target.value)
                    }
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={color.quantity}
                    onChange={(e) =>
                      handleColorChange(
                        index,
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeColor(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addColor} className="mt-2">
              Add Color
            </Button>
          </div>


          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
