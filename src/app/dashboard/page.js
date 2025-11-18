"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ErrorBoundary, DataErrorBoundary } from "@/components/ErrorBoundary";
import { useCustomers } from "@/hooks/useCustomers";
import { useTransactions } from "@/hooks/useTransactions";
import { useFabrics } from "@/hooks/useFabrics";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useToast } from "@/hooks/use-toast";
import { formatLargeNumber } from "@/lib/utils";
import { PAGE_TITLES } from "@/lib/constants";
import {
  Users,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  RefreshCw,
  History,
  Database,
} from "lucide-react";
import { backupService } from "@/services/backupService";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// Dynamically import heavy components
const QuickStatCard = dynamic(
  () => import("@/components/QuickStatCard").then((mod) => mod.QuickStatCard),
  {
    loading: () => (
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

const RecentTransactions = dynamic(
  () =>
    import("@/components/RecentTransactions").then(
      (mod) => mod.RecentTransactions
    ),
  {
    loading: () => (
      <Card className="border-none shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [backupLoading, setBackupLoading] = useState(false);

  // Fetch data with React Query
  const { data: customersData, isLoading: customersLoading } = useCustomers({ page: 1, limit: 10000 });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({ page: 1, limit: 10000 });
  const { data: fabricsData, isLoading: fabricsLoading } = useFabrics({ page: 1, limit: 10000 });
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ page: 1, limit: 10000 });

  const isLoading = customersLoading || transactionsLoading || fabricsLoading || suppliersLoading;

  const stats = useMemo(() => {
    const customers = customersData?.data || [];
    const transactions = transactionsData?.data || [];
    const fabrics = fabricsData?.data || [];
    const suppliers = suppliersData?.data || [];

    if (!customers.length || !transactions.length) {
      return {
        totalBill: 0,
        totalDeposit: 0,
        totalDue: 0,
        totalCustomers: 0,
        totalFabrics: 0,
        totalSuppliers: 0,
        recentTransactions: [],
      };
    }

    const totals = customers.reduce(
      (acc, customer) => {
        const customerTransactions = transactions.filter((t) => t.customerId === customer.id);
        const customerTotal = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.total) || 0),
          0
        );
        const customerDeposit = customerTransactions.reduce(
          (sum, t) => sum + (Number(t.deposit) || 0),
          0
        );
        const customerDue = customerTotal - customerDeposit;

        return {
          totalBill: acc.totalBill + customerTotal,
          totalDeposit: acc.totalDeposit + customerDeposit,
          totalDue: acc.totalDue + customerDue,
        };
      },
      { totalBill: 0, totalDeposit: 0, totalDue: 0 }
    );

    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 5);

    return {
      ...totals,
      totalCustomers: customers.length,
      totalFabrics: fabrics.length,
      totalSuppliers: suppliers.length,
      recentTransactions,
    };
  }, [customersData, transactionsData, fabricsData, suppliersData]);

  const handleQuickBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await backupService.exportToJSON();
      toast({
        title: "Backup Created",
        description: `Data exported to ${result.filename}. ${result.recordCount} records backed up.`,
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Recent Activity */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DataErrorBoundary>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {PAGE_TITLES.DASHBOARD}
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here&apos;s an overview of your business
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => router.push("/cashmemo")}
            >
              <FileText className="mr-2 h-4 w-4" />
              New Cash Memo
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={handleQuickBackup}
              disabled={backupLoading}
            >
              {backupLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Backup Data
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickStatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={Users}
            trend="up"
            trendValue="12%"
          />
          <QuickStatCard
            title="Total Fabrics"
            value={stats.totalFabrics}
            icon={Package}
            trend="up"
            trendValue="8%"
          />
          <QuickStatCard
            title="Total Suppliers"
            value={stats.totalSuppliers}
            icon={Users}
            trend="up"
            trendValue="5%"
          />
          <QuickStatCard
            title="Total Transactions"
            value={transactionsData?.data?.length || 0}
            icon={History}
            trend="up"
            trendValue="15%"
          />
        </div>

        {/* Financial Summary */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Financial Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-blue-800">
                    Total Bill Amount
                  </h3>
                  <DollarSign className="h-4 w-4 text-blue-800" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  Taka {formatLargeNumber(stats.totalBill)}
                </div>
                <div className="flex items-center mt-2 text-sm text-blue-800">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>12% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-green-800">
                    Total Deposit
                  </h3>
                  <DollarSign className="h-4 w-4 text-green-800" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  Taka {formatLargeNumber(stats.totalDeposit)}
                </div>
                <div className="flex items-center mt-2 text-sm text-green-800">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>8% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-100 border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-red-800">
                    Total Due Amount
                  </h3>
                  <DollarSign className="h-4 w-4 text-red-800" />
                </div>
                <div className="text-2xl font-bold text-red-900">
                  Taka {formatLargeNumber(stats.totalDue)}
                </div>
                <div className="flex items-center mt-2 text-sm text-red-800">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>3% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity and Low Stock */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RecentTransactions
            transactions={stats.recentTransactions}
            customers={customersData?.data || []}
          />
        </div>
      </div>
    </DataErrorBoundary>
  );
}
