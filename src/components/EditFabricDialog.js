"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Edit, Trash2, Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { fabricSchema } from "@/lib/schemas";

export function EditFabricDialog({ fabric, onSave, onDelete, children }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fabricSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "",
      description: "",
      unit: "piece",
    },
  });

  const categoryValue = watch("category");
  const unitValue = watch("unit");

  useEffect(() => {
    if (fabric) {
      reset({
        name: fabric.name || "",
        code: fabric.code || "",
        category: fabric.category || "",
        description: fabric.description || "",
        unit: fabric.unit || "piece",
      });
    }
  }, [fabric, reset]);

  const fabricUnits = [
    { value: "piece", label: "Piece" },
    { value: "meter", label: "Meter" },
    { value: "yard", label: "Yard" },
    { value: "kg", label: "Kilogram" },
  ];

  const fabricCategories = [
    "Cotton",
    "Silk",
    "Wool",
    "Linen",
    "Polyester",
    "Nylon",
    "Rayon",
    "Denim",
    "Chiffon",
    "Satin",
    "Other",
  ];

  const onSubmit = async (data) => {
    try {
      await onSave(fabric.id, data);
      setOpen(false);
    } catch (error) {
      logger.error("Error updating fabric:", error);
      // alert("Failed to update fabric. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${fabric.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(fabric.id);
      setOpen(false);
    } catch (error) {
      logger.error("Error deleting fabric:", error);
      // alert("Failed to delete fabric. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && fabric) {
       reset({
        name: fabric.name || "",
        code: fabric.code || "",
        category: fabric.category || "",
        description: fabric.description || "",
        unit: fabric.unit || "piece",
      });
    }
  };

  if (!fabric) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Fabric</DialogTitle>
        </DialogHeader>

        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Fabric Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Fabric Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter fabric name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Fabric Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Fabric Code *</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="Enter unique code"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={categoryValue || ""}
                onValueChange={(value) => setValue("category", value, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {fabricCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {errors.category && (
                <p className="text-red-500 text-sm">{errors.category.message}</p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={unitValue}
                onValueChange={(value) => setValue("unit", value, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {fabricUnits.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {errors.unit && (
                <p className="text-red-500 text-sm">{errors.unit.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...register("description")}
                placeholder="Enter fabric description (optional)"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting || isDeleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isDeleting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
