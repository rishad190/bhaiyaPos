"use client";

import dynamic from "next/dynamic";
import LoadingFallback from "./LoadingFallback";

// Dynamically import heavy pages with loading fallbacks
export const DynamicDashboard = dynamic(() => import("@/app/dashboard/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicInventory = dynamic(() => import("@/app/inventory/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicCashMemo = dynamic(() => import("@/app/cashmemo/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicCashbook = dynamic(() => import("@/app/cashbook/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicCustomers = dynamic(() => import("@/app/customers/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicSuppliers = dynamic(() => import("@/app/suppliers/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicSettings = dynamic(() => import("@/app/settings/page"), {
  loading: () => <LoadingFallback />,
  ssr: false,
});

export const DynamicInventoryProfit = dynamic(
  () => import("@/app/inventory-profit/page"),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const DynamicProfitDetails = dynamic(
  () => import("@/app/profit-details/page"),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Dynamic imports for dialog components (heavy UI components)
export const DynamicAddFabricDialog = dynamic(
  () => import("@/components/AddFabricDialog"),
  {
    ssr: false,
  }
);

export const DynamicPurchaseStockDialog = dynamic(
  () => import("@/components/PurchaseStockDialog"),
  {
    ssr: false,
  }
);

export const DynamicEditFabricDialog = dynamic(
  () => import("@/components/EditFabricDialog"),
  {
    ssr: false,
  }
);

export const DynamicAddCustomerDialog = dynamic(
  () => import("@/components/AddCustomerDialog"),
  {
    ssr: false,
  }
);

export const DynamicAddSupplierDialog = dynamic(
  () => import("@/components/AddSupplierDialog"),
  {
    ssr: false,
  }
);
