import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormErrorBoundary } from "@/components/ErrorBoundary";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { STORES, DEFAULT_STORE } from "@/lib/constants";
import { customerSchema } from "@/lib/schemas";

export function EditCustomerDialog({
  customer,
  onEditCustomer,
  isOpen,
  onClose,
}) {
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
      address: "",
      email: "",
      storeId: DEFAULT_STORE,
    },
  });

  // Use useEffect to update form data when customer changes
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        email: customer.email || "",
        storeId: customer.storeId || DEFAULT_STORE,
      });
    }
  }, [customer, reset]);

  const onSubmit = async (data) => {
    try {
      await onEditCustomer(customer.id, data);
      onClose();
    } catch (error) {
      logger.error("Error updating customer:", error);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                aria-label="Customer name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone *</label>
              <Input
                aria-label="Customer phone number"
                {...register("phone")}
                className={errors.phone ? "border-red-500" : ""}
              />
               {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                aria-label="Customer address"
                {...register("address")}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                aria-label="Customer email address"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Store</label>
              <select
                aria-label="Select store"
                {...register("storeId")}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.storeId ? "border-red-500" : ""
                }`}
                disabled={isSubmitting}
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} aria-label="Cancel editing customer" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" aria-label="Update customer details" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Updating...
                  </>
                ) : (
                  "Update Customer"
                )}
              </Button>
            </div>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
