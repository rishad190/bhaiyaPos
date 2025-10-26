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
import { Label } from "@/components/ui/label";

export function PurchaseStockDialog({
  fabrics,
  suppliers = [],
  onPurchaseStock,
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    fabricId: "",
    quantity: "",
    unitCost: "",
    supplierId: "",
    supplierName: "",
    supplierPhone: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    containerName: "",
    numberOfColors: "",
    colors: [],
  });
  const [errors, setErrors] = useState({});
  const [isNewSupplier, setIsNewSupplier] = useState(false);

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
    if (!formData.fabricId) newErrors.fabricId = "Please select a fabric";

    if (formData.colors.length > 0) {
        if (!formData.containerName) newErrors.containerName = "Container name is required";
        if (!formData.unitCost) newErrors.unitCost = "Price is required";
    } else {
        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            newErrors.quantity = "Please enter a valid quantity";
        }
        if (!formData.unitCost || parseFloat(formData.unitCost) <= 0) {
            newErrors.unitCost = "Please enter a valid unit cost";
        }
        if (!formData.invoiceNumber?.trim()) {
            newErrors.invoiceNumber = "Invoice number is required";
        }
        if (!isNewSupplier && !formData.supplierId) {
            newErrors.supplierId = "Please select a supplier";
        }
        if (isNewSupplier) {
            if (!formData.supplierName?.trim()) {
                newErrors.supplierName = "Supplier name is required";
            }
            if (!formData.supplierPhone?.trim()) {
                newErrors.supplierPhone = "Supplier phone is required";
            }
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
        if (formData.colors.length > 0) {
            const { fabricId, containerName, unitCost, colors } = formData;
            await onPurchaseStock({
                fabricId,
                quantity: totalColorQuantity,
                unitCost: parseFloat(unitCost),
                totalCost: totalColorQuantity * parseFloat(unitCost),
                supplierName: containerName, // Using container name as supplier
                colors: colors,
                createdAt: new Date().toISOString(),
              });
        } else {
            const selectedSupplier = !isNewSupplier
            ? suppliers.find((s) => s.id === formData.supplierId)
            : null;
    
          await onPurchaseStock({
            ...formData,
            supplierName: !isNewSupplier
              ? selectedSupplier?.name
              : formData.supplierName,
            quantity: parseFloat(formData.quantity),
            unitCost: parseFloat(formData.unitCost),
            totalCost:
              parseFloat(formData.quantity) * parseFloat(formData.unitCost),
            createdAt: new Date().toISOString(),
          });
        }

      setOpen(false);
      setFormData({
        fabricId: "",
        quantity: "",
        unitCost: "",
        supplierId: "",
        supplierName: "",
        supplierPhone: "",
        invoiceNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0],
        containerName: "",
        numberOfColors: "",
        colors: [],
      });
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Purchase Stock</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Select Fabric *</label>
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
                    {fabrics.map((fabric) => (
                    <SelectItem key={fabric.id} value={fabric.id}>
                        {fabric.code} - {fabric.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                {errors.fabricId && (
                <p className="text-sm text-red-500">{errors.fabricId}</p>
                )}
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                value={formData.invoiceNumber}
                onChange={handleFormChange}
                name="invoiceNumber"
                placeholder="Enter invoice number"
                />
            </div>

            <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                <h3 className="font-medium">Supplier Details</h3>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                    setIsNewSupplier(!isNewSupplier);
                    setFormData((prev) => ({
                        ...prev,
                        supplierId: "",
                        supplierName: "",
                        supplierPhone: "",
                    }));
                    }}
                >
                    {isNewSupplier ? "Select Existing" : "Add New"}
                </Button>
                </div>

                {!isNewSupplier ? (
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Supplier</label>
                    <Select
                    value={formData.supplierId}
                    onValueChange={(value) =>
                        setFormData({ ...formData, supplierId: value })
                    }
                    >
                    <SelectTrigger
                        className={errors.supplierId ? "border-red-500" : ""}
                    >
                        <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name} - {supplier.phone}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                ) : (
                <>
                    <div className="space-y-2">
                    <label className="text-sm font-medium">Supplier Name</label>
                    <Input
                        value={formData.supplierName}
                        onChange={handleFormChange}
                        name="supplierName"
                        placeholder="Enter supplier name"
                    />
                    </div>

                    <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input
                        value={formData.supplierPhone}
                        onChange={handleFormChange}
                        name="supplierPhone"
                        placeholder="Enter phone number"
                    />
                    </div>
                </>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={handleFormChange}
                    name="quantity"
                    placeholder="Enter quantity"
                />
                </div>

                <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost *</label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={handleFormChange}
                    name="unitCost"
                    className={errors.unitCost ? "border-red-500" : ""}
                    placeholder="Enter unit cost"
                />
                {errors.unitCost && (
                    <p className="text-sm text-red-500">{errors.unitCost}</p>
                )}
                </div>
            </div>

            <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Color-wise Details (Optional)</h3>
                <div>
                    <label className="text-sm font-medium">Container Name</label>
                    <Input
                        name="containerName"
                        value={formData.containerName}
                        onChange={handleFormChange}
                        placeholder="Enter container name"
                    />
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
                <div>
                    <label className="text-sm font-medium">Total Color Quantity</label>
                    <Input readOnly value={totalColorQuantity} />
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Color Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Date</label>
                <Input
                type="date"
                value={formData.purchaseDate}
                onChange={handleFormChange}
                name="purchaseDate"
                />
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
            <Button type="submit">Purchase Stock</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}