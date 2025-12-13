import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2 } from "lucide-react";
import logger from "@/utils/logger";
import { STORES } from "@/lib/constants";
import { supplierSchema } from "@/lib/schemas";

export function EditSupplierDialog({
  supplier,
  isOpen,
  onClose,
  onEditSupplier,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      storeId: "",
      totalDue: 0,
    },
  });

  // Watch storeId to control Select component
  const storeIdValue = watch("storeId");

  useEffect(() => {
    if (supplier) {
      reset({
        name: supplier.name || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        storeId: supplier.storeId || "",
        totalDue: supplier.totalDue || 0,
      });
    }
  }, [supplier, reset]);

  const onSubmit = async (data) => {
    try {
      await onEditSupplier(supplier.id, data);
      onClose();
    } catch (error) {
      logger.error("Error updating supplier:", error);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <FormErrorBoundary>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("address")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select
                  value={storeIdValue}
                  onValueChange={(value) => setValue("storeId", value, { shouldValidate: true })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className={errors.storeId ? "border-red-500" : ""}>
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
                {errors.storeId && (
                  <p className="text-red-500 text-sm">{errors.storeId.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </FormErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
