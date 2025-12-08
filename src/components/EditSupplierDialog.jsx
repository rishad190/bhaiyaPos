import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Label } from "@/components/ui/label";
import logger from "@/utils/logger";
import { STORES } from "@/lib/constants";

export function EditSupplierDialog({
  supplier,
  isOpen,
  onClose,
  onEditSupplier,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    storeId: "",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        storeId: supplier.storeId || "",
      });
    }
  }, [supplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onEditSupplier(supplier.id, formData);
      onClose();
    } catch (error) {
      logger.error("Error updating supplier:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select
                value={formData.storeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, storeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {STORES.map((store) => (
                    <SelectItem key={store.value} value={store.value}>
                      {store.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
