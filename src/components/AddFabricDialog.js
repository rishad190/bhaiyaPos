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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddFabricDialog({ onAddFabric, children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    unit: "piece",
    description: "",
    lowStockThreshold: 20,
    batches: [],
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.code?.trim()) newErrors.code = "Code is required";
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.category?.trim()) newErrors.category = "Category is required";
    if (!formData.unit?.trim()) newErrors.unit = "Unit is required";
    if (formData.lowStockThreshold < 0)
      newErrors.lowStockThreshold = "Threshold must be positive";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onAddFabric({
        ...formData,
        code: formData.code.toUpperCase(),
        createdAt: new Date().toISOString(),
      });
      setOpen(false);
      setFormData({
        code: "",
        name: "",
        category: "",
        unit: "piece",
        description: "",
        lowStockThreshold: 20,
        batches: [],
      });
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Fabric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fabric Code *</label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className={errors.code ? "border-red-500" : ""}
                placeholder="Enter fabric code"
              />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={errors.name ? "border-red-500" : ""}
                placeholder="Enter fabric name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className={errors.category ? "border-red-500" : ""}
                placeholder="Enter category"
              />
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit *</label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="yard">Yard</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={errors.description ? "border-red-500" : ""}
              placeholder="Enter description"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Low Stock Threshold</label>
            <Input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  lowStockThreshold: parseInt(e.target.value) || 0,
                })
              }
              className={errors.lowStockThreshold ? "border-red-500" : ""}
              placeholder="Enter threshold"
            />
            {errors.lowStockThreshold && (
              <p className="text-sm text-red-500">{errors.lowStockThreshold}</p>
            )}
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Fabric</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
