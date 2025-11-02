import { useState, useMemo } from "react";
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

export function PurchaseStockDialog({ fabrics, onPurchaseStock, children }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fabricId: "",
    unitCost: "",
    supplierName: "",
    containerName: "",
    numberOfColors: "",
    colors: [],
    unit: "METER",
    purchaseDate: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState({});

  const totalColorQuantity = useMemo(() => {
    return formData.colors.reduce(
      (sum, item) => sum + (parseFloat(item.quantity) || 0),
      0
    );
  }, [formData.colors]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "numberOfColors") {
      const num = parseInt(value, 10);
      if (num > 0) {
        setFormData((prev) => ({
          ...prev,
          colors: Array.from({ length: num }, () => ({ color: "", quantity: "" })),
        }));
      } else {
        setFormData((prev) => ({ ...prev, colors: [] }));
      }
    }
  };

  const handleColorInputChange = (index, e) => {
    const { name, value } = e.target;
    const newColors = [...formData.colors];
    newColors[index][name] = value;
    setFormData((prev) => ({ ...prev, colors: newColors }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fabricId) newErrors.fabricId = "Fabric is required";
    if (!formData.containerName) newErrors.containerName = "Container name is required";
    if (formData.colors.some(c => !c.color || !c.quantity)) {
      newErrors.colors = "All color fields are required";
    }
    if (!formData.unitCost || parseFloat(formData.unitCost) <= 0)
      newErrors.unitCost = "A valid unit cost is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const purchaseData = {
        fabricId: formData.fabricId,
        unitCost: parseFloat(formData.unitCost),
        supplierName: formData.supplierName,
        containerName: formData.containerName,
        unit: formData.unit,
        purchaseDate: formData.purchaseDate,
        createdAt: new Date().toISOString(),
        colors: formData.colors,
        quantity: totalColorQuantity,
      };
      purchaseData.totalCost = purchaseData.quantity * purchaseData.unitCost;

      await onPurchaseStock(purchaseData);
      setOpen(false);
      setFormData({
        fabricId: "",
        unitCost: "",
        supplierName: "",
        containerName: "",
        numberOfColors: "",
        colors: [],
        unit: "METER",
        purchaseDate: new Date().toISOString().split("T")[0],
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
          <DialogTitle>Purchase Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fabric *</label>
            <Select
              value={formData.fabricId}
              onValueChange={(value) =>
                setFormData({ ...formData, fabricId: value })
              }
            >
              <SelectTrigger
                className={errors.fabricId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabrics?.map((fabric) => (
                  <SelectItem key={fabric.id} value={fabric.id}>
                    {fabric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fabricId && (
              <p className="text-sm text-red-500">{errors.fabricId}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name</label>
            <Input
              name="supplierName"
              value={formData.supplierName}
              onChange={handleFormChange}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Color-wise Details</h3>
            <div>
              <label className="text-sm font-medium">Container Name</label>
              <Input
                name="containerName"
                value={formData.containerName}
                onChange={handleFormChange}
                placeholder="Enter container name"
                className={errors.containerName ? "border-red-500" : ""}
              />
               {errors.containerName && (
                <p className="text-sm text-red-500">{errors.containerName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Number of Colors</label>
              <Input
                name="numberOfColors"
                type="number"
                value={formData.numberOfColors}
                onChange={handleFormChange}
                placeholder="Enter number of colors"
              />
            </div>
            {formData.colors.map((color, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  name="color"
                  value={color.color}
                  onChange={(e) => handleColorInputChange(index, e)}
                  placeholder={`Color ${index + 1}`}
                />
                <Input
                  name="quantity"
                  type="number"
                  value={color.quantity}
                  onChange={(e) => handleColorInputChange(index, e)}
                  placeholder="Quantity"
                />
              </div>
            ))}
            {errors.colors && (
                <p className="text-sm text-red-500">{errors.colors}</p>
              )}
            <div>
              <label className="text-sm font-medium">Total Color Quantity</label>
              <Input readOnly value={totalColorQuantity} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Cost *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitCost}
                onChange={(e) =>
                  setFormData({ ...formData, unitCost: e.target.value })
                }
                className={errors.unitCost ? "border-red-500" : ""}
                placeholder="Enter unit cost"
              />
              {errors.unitCost && (
                <p className="text-sm text-red-500">{errors.unitCost}</p>
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
                  <SelectItem value="METER">Meter</SelectItem>
                  <SelectItem value="YARD">Yard</SelectItem>
                  <SelectItem value="PIECE">Piece</SelectItem>
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Date</label>
              <Input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleFormChange}
              />
            </div>
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
            <Button type="submit">Purchase</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}