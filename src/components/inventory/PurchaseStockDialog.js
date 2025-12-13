"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Plus, Minus, Package, Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { purchaseStockSchema } from "@/lib/schemas";

export function PurchaseStockDialog({
  fabrics = [],
  suppliers = [],
  onPurchaseStock,
  children,
}) {
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(purchaseStockSchema),
    defaultValues: {
      fabricId: "",
      containerNo: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      costPerPiece: 0,
      supplierId: "",
      items: [{ colorName: "", quantity: "" }], // Quantity as string initially to allow empty
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fabricIdValue = watch("fabricId");
  const supplierIdValue = watch("supplierId");

  const selectedFabric = fabrics.find((f) => f.id === fabricIdValue);

  const onSubmit = async (data) => {
    try {
      await onPurchaseStock({
        ...data,
        items: data.items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
        })),
      });
      setOpen(false);
      reset(); // Reset form after success
    } catch (error) {
      logger.error("Error purchasing stock:", error);
      // alert("Failed to purchase stock. Please try again.");
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset(); // Optional: reset when closing without saving? Or keep state?
      // Usually better to keep state unless explicitly cancelled, but here we reset on close for safety/simplicity
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Fabric Selection */}
          <div className="space-y-2">
            <Label htmlFor="fabricId">Fabric *</Label>
            <Select
              value={fabricIdValue}
              onValueChange={(value) => setValue("fabricId", value, { shouldValidate: true })}
            >
              <SelectTrigger className={errors.fabricId ? "border-red-500" : ""}>
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
            {errors.fabricId && (
              <p className="text-red-500 text-sm">{errors.fabricId.message}</p>
            )}
          </div>

          {/* Container Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="containerNo">Container No. *</Label>
              <Input
                id="containerNo"
                {...register("containerNo")}
                placeholder="Enter container number"
                className={errors.containerNo ? "border-red-500" : ""}
              />
              {errors.containerNo && (
                <p className="text-red-500 text-sm">{errors.containerNo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register("purchaseDate")}
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
                {...register("costPerPiece")}
                placeholder="0.00"
                className={errors.costPerPiece ? "border-red-500" : ""}
              />
              {errors.costPerPiece && (
                <p className="text-red-500 text-sm">{errors.costPerPiece.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={supplierIdValue || "no-supplier"} // Handle null/empty for Select value
                onValueChange={(value) => setValue("supplierId", value === "no-supplier" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-supplier">No Supplier</SelectItem>
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
                onClick={() => append({ colorName: "", quantity: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Color
              </Button>
            </div>
            
            {errors.items && (
               <p className="text-red-500 text-sm">{errors.items.message}</p>
            )}

            {fields.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`items.${index}.colorName`}>Color Name</Label>
                  <Input
                    {...register(`items.${index}.colorName`)}
                    placeholder="Enter color name"
                    className={errors.items?.[index]?.colorName ? "border-red-500" : ""}
                  />
                   {errors.items?.[index]?.colorName && (
                    <p className="text-red-500 text-sm">{errors.items[index].colorName.message}</p>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>
                    Quantity ({selectedFabric?.unit || "pieces"})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`items.${index}.quantity`)}
                    placeholder="0.00"
                    className={errors.items?.[index]?.quantity ? "border-red-500" : ""}
                  />
                   {errors.items?.[index]?.quantity && (
                    <p className="text-red-500 text-sm">{errors.items[index].quantity.message}</p>
                  )}
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
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
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Purchasing...
                </>
              ) : (
                "Purchase Stock"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
