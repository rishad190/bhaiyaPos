import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Input } from "@/components/ui/input";

export function AddSupplierDialog({ onAddSupplier }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "", // Add address field
    storeId: "STORE1",
    totalDue: 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAddSupplier({
        ...formData,
        // Generate a unique ID
      });
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "", // Add address field
        storeId: "STORE1",
        totalDue: 0,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error adding supplier:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Supplier</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone *</label>
            <Input
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Enter supplier address"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Store</label>
            <select
              className="w-full border rounded-md px-3 py-2"
              value={formData.storeId}
              onChange={(e) =>
                setFormData({ ...formData, storeId: e.target.value })
              }
            >
              <option value="STORE1">Store 1</option>
              <option value="STORE2">Store 2</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Supplier</Button>
          </div>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
