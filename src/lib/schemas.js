import { z } from "zod";
import { DEFAULT_STORE } from "./constants";

export const transactionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  memoNumber: z.string().optional(),
  details: z.string().optional(),
  total: z.coerce
    .number({ invalid_type_error: "Total must be a number" })
    .min(0, "Total must be 0 or greater"),
  deposit: z.coerce
    .number({ invalid_type_error: "Deposit must be a number" })
    .min(0, "Deposit must be 0 or greater"),
  storeId: z.string().min(1, "Store is required").default(DEFAULT_STORE),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  storeId: z.string().min(1, "Store is required").default(DEFAULT_STORE),
  totalDue: z.coerce.number().default(0),
});

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  storeId: z.string().min(1, "Store is required").default(DEFAULT_STORE),
});

export const cashTransactionSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    description: z.string().min(1, "Description is required"),
    reference: z.string().optional(),
    cashIn: z.coerce.number().min(0).optional(),
    cashOut: z.coerce.number().min(0).optional(),
  })
  .refine(
    (data) => (data.cashIn || 0) > 0 || (data.cashOut || 0) > 0,
    {
      message: "Either Cash In or Cash Out must be greater than 0",
      path: ["cashIn"], // Show error on cashIn field (or we could show on both or root)
    }
  );

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0.01, "Amount must be greater than 0"),
});

export const fabricSchema = z.object({
  name: z.string().min(1, "Fabric name is required"),
  code: z.string().min(1, "Fabric code is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional(),
});
