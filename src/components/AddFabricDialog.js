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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Plus } from "lucide-react";

export function AddFabricDialog({ onAddFabric, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    description: "",
    unit: "piece",
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim() || !formData.code.trim() || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await onAddFabric(formData);
      setOpen(false);
      // Reset form
      setFormData({
        name: "",
        code: "",
        category: "",
        description: "",
        unit: "piece",
      });
    } catch (error) {
      console.error("Error adding fabric:", error);
      alert("Failed to add fabric. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Fabric
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Fabric</DialogTitle>
        </DialogHeader>

        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fabric Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Fabric Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter fabric name"
              required
            />
          </div>

          {/* Fabric Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Fabric Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
              placeholder="Enter unique code"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
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
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => handleChange("unit", value)}
            >
              <SelectTrigger>
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter fabric description (optional)"
            />
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
              {loading ? "Adding..." : "Add Fabric"}
            </Button>
          </div>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
