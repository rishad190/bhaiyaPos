"use client";
import { useState } from "react";
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
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { useAddCustomer } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { STORES, DEFAULT_STORE } from "@/lib/constants";
import { customerSchema } from "@/lib/schemas";

export function AddCustomerDialog({ onClose }) {
  const addCustomerMutation = useAddCustomer();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // useCustomers hook probably uses mutation.isPending, but we can use React Hook Form's isSubmitting too
  // actually, let's keep mutation handling inside onSubmit but rely on isSubmitting for UI state
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      storeId: DEFAULT_STORE,
    },
  });

  const onSubmit = async (data) => {
    try {
      await addCustomerMutation.mutateAsync({
        name: data.name,
        phone: data.phone,
        email: data.email || "", // ensure optional fields are handled
        address: data.address || "",
        storeId: data.storeId,
      });
      
      setOpen(false);
      reset(); 
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
      // We don't alert here anymore, toast is enough
    }
  };

  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="Add new customer">Add New Customer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="name"
                {...register("name")}
                aria-label="Customer name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone *
              </label>
              <Input
                id="phone"
                {...register("phone")}
                aria-label="Customer phone number"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-label="Customer email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                {...register("address")}
                aria-label="Customer address"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="storeId" className="text-sm font-medium">
                Store
              </label>
              <select
                id="storeId"
                {...register("storeId")}
                aria-label="Select store"
                disabled={isSubmitting}
                className="w-full border rounded-md px-3 py-2"
              >
                {STORES.map((store) => (
                  <option key={store.value} value={store.value}>
                    {store.label}
                  </option>
                ))}
              </select>
               {errors.storeId && (
                <p className="text-red-500 text-sm">{errors.storeId.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                aria-label="Cancel adding new customer"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" aria-label="Save new customer" disabled={isSubmitting}>
                {isSubmitting ? (
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
