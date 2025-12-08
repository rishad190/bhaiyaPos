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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { useAddCustomer } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { STORES, DEFAULT_STORE } from "@/lib/constants";

export function AddCustomerDialog({ onClose }) {
  const addCustomerMutation = useAddCustomer();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    storeId: DEFAULT_STORE,
  });

  const loading = addCustomerMutation.isPending;

  const validate = () => {
    if (!formData.name || !formData.phone) {
      alert("Name and Phone are required!");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await addCustomerMutation.mutateAsync({
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        storeId: formData.storeId,
      });
      setOpen(false);
      onClose?.();
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      });
      alert("Failed to add customer. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button aria-label="Add new customer">Add New Customer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name *
            </label>
            <Input
              id="name"
              required
              aria-label="Customer name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone *
            </label>
            <Input
              id="phone"
              required
              aria-label="Customer phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              aria-label="Customer email address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">
              Address
            </label>
            <Input
              id="address"
              aria-label="Customer address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="storeId" className="text-sm font-medium">
              Store
            </label>
            <select
              id="storeId"
              aria-label="Select store"
              value={formData.storeId}
              onChange={(e) =>
                setFormData({ ...formData, storeId: e.target.value })
              }
              disabled={loading}
              className="w-full border rounded-md px-3 py-2"
            >
              {STORES.map((store) => (
                <option key={store.value} value={store.value}>
                  {store.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              aria-label="Cancel adding new customer"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" aria-label="Save new customer" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Customer"
              )}
            </Button>
          </div>
        </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
