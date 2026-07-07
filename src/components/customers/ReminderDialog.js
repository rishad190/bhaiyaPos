"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/useCustomers";
import { reminderSchema } from "@/lib/schemas";
import { Search, Loader2 } from "lucide-react";
import logger from "@/utils/logger";

export function ReminderDialog({
  open,
  onOpenChange,
  customerId: propCustomerId = "",
  customerName: propCustomerName = "",
  customerPhone: propCustomerPhone = "",
  reminder = null, // If provided, we are in Edit mode
  onSubmitReminder,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Fetch customers for the general context selection
  const { data: customersData } = useCustomers({
    page: 1,
    limit: 100, // Fetch up to 100 customers for selection
    searchTerm: searchTerm,
  });
  const customersList = customersData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      customerId: "",
      customerName: "",
      customerPhone: "",
      title: "",
      amount: "",
      type: "check",
      dueDate: new Date().toISOString().split("T")[0],
      dueTime: "10:00",
      status: "pending",
      notified: false,
    },
  });

  const watchType = watch("type");

  // Prepopulate form fields on load/edit/prop changes
  useEffect(() => {
    if (open) {
      if (reminder) {
        // Edit mode
        reset({
          customerId: reminder.customerId,
          customerName: reminder.customerName,
          customerPhone: reminder.customerPhone || "",
          title: reminder.title,
          amount: reminder.amount || "",
          type: reminder.type,
          dueDate: reminder.dueDate,
          dueTime: reminder.dueTime,
          status: reminder.status || "pending",
          notified: reminder.notified || false,
        });
        setSelectedCustomer({
          id: reminder.customerId,
          name: reminder.customerName,
          phone: reminder.customerPhone || "",
        });
      } else if (propCustomerId) {
        // Pre-filled customer mode (e.g. from customer profile page)
        reset({
          customerId: propCustomerId,
          customerName: propCustomerName,
          customerPhone: propCustomerPhone,
          title: "",
          amount: "",
          type: "check",
          dueDate: new Date().toISOString().split("T")[0],
          dueTime: "10:00",
          status: "pending",
          notified: false,
        });
        setSelectedCustomer({
          id: propCustomerId,
          name: propCustomerName,
          phone: propCustomerPhone,
        });
      } else {
        // New general mode
        reset({
          customerId: "",
          customerName: "",
          customerPhone: "",
          title: "",
          amount: "",
          type: "check",
          dueDate: new Date().toISOString().split("T")[0],
          dueTime: "10:00",
          status: "pending",
          notified: false,
        });
        setSelectedCustomer(null);
        setSearchTerm("");
      }
    }
  }, [open, reminder, propCustomerId, propCustomerName, propCustomerPhone, reset]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setValue("customerId", customer.id);
    setValue("customerName", customer.name);
    setValue("customerPhone", customer.phone || "");
    setShowCustomerDropdown(false);
    setSearchTerm("");
  };

  const handleFormSubmit = async (data) => {
    try {
      await onSubmitReminder(data);
      onOpenChange(false);
      reset();
    } catch (error) {
      logger.error("Error submitting reminder dialog:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {reminder ? "Edit Reminder" : "Set Reminder"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          {/* Customer Selection (Only in general context, disabled in Edit/Customer Details context) */}
          {!propCustomerId && !reminder ? (
            <div className="space-y-2 relative">
              <Label className="text-sm font-medium">Select Customer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer (name or phone)..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
              </div>

              {selectedCustomer && (
                <div className="mt-2 p-2 bg-muted rounded-md flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-foreground">{selectedCustomer.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{selectedCustomer.phone}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-red-500 text-xs hover:bg-transparent"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setValue("customerId", "");
                      setValue("customerName", "");
                      setValue("customerPhone", "");
                    }}
                  >
                    Change
                  </Button>
                </div>
              )}

              {errors.customerId && (
                <p className="text-red-500 text-xs">{errors.customerId.message}</p>
              )}

              {showCustomerDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-[180px] overflow-y-auto">
                  {customersList.length > 0 ? (
                    customersList.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b last:border-0"
                        onClick={() => handleSelectCustomer(customer)}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-muted-foreground">{customer.phone}</div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No customer found
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <div className="font-semibold text-foreground text-base">
                {selectedCustomer?.name || propCustomerName}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedCustomer?.phone || propCustomerPhone}
              </div>
            </div>
          )}

          {/* Payment Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={watchType === "check" ? "default" : "outline"}
                className="w-full"
                onClick={() => setValue("type", "check")}
              >
                Check
              </Button>
              <Button
                type="button"
                variant={watchType === "cash" ? "default" : "outline"}
                className="w-full"
                onClick={() => setValue("type", "cash")}
              >
                Cash
              </Button>
            </div>
            {errors.type && (
              <p className="text-red-500 text-xs">{errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount (Optional)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount..."
              {...register("amount")}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-red-500 text-xs">{errors.amount.message}</p>
            )}
          </div>

          {/* Title/Details */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Details/Note *</Label>
            <Textarea
              id="title"
              placeholder="e.g. Bank name and check details, or cash details"
              rows={2}
              {...register("title")}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-xs">{errors.title.message}</p>
            )}
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register("dueDate")}
                className={errors.dueDate ? "border-red-500" : ""}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueTime" className="text-sm font-medium">Due Time *</Label>
              <Input
                id="dueTime"
                type="time"
                {...register("dueTime")}
                className={errors.dueTime ? "border-red-500" : ""}
              />
              {errors.dueTime && (
                <p className="text-red-500 text-xs">{errors.dueTime.message}</p>
              )}
            </div>
          </div>

          {/* Status field in Edit Mode */}
          {reminder && (
            <div className="flex items-center gap-2 border p-3 rounded-md">
              <input
                id="statusCheck"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={watch("status") === "completed"}
                onChange={(e) =>
                  setValue("status", e.target.checked ? "completed" : "pending")
                }
              />
              <Label htmlFor="statusCheck" className="text-sm font-semibold cursor-pointer">
                Mark as Completed
              </Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!watch("customerId") && !propCustomerId)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
