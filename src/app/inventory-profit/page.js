"use client";
import { useState, useMemo } from "react";
import { useTransactionData } from "@/contexts/TransactionContext";
import { useCustomerData } from "@/contexts/CustomerContext";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function InventoryProfitPage() {
  const { transactions, deleteTransaction } = useTransactionData();
  const { customers } = useCustomerData();
  const router = useRouter();
  const { toast } = useToast();
  const [loadingActions, setLoadingActions] = useState(false);

  const salesTransactions = useMemo(() => {
    if (!transactions || !customers) return [];
    return transactions
      .filter((t) => t && t.type === "SALE")
      .map((t) => {
        const customer = customers.find((c) => c && c.id === t.customerId);
        return { ...t, customerName: customer ? customer.name : "N/A" };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customers]);

  const handleRowClick = (transactionId) => {
    router.push(`/inventory-profit/${transactionId}`);
  };

  const handleDelete = async (e, transactionId) => {
    e.stopPropagation();
    // IMPORTANT: Replace window.confirm with a custom modal UI
    if (
      !window.confirm(
        "Are you sure you want to delete this sales transaction? This action cannot be undone."
      )
    ) {
      return;
    }
    setLoadingActions(true);
    try {
      await deleteTransaction(transactionId);
      toast({
        title: "Success",
        description: "Sales transaction deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingActions(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Inventory Profit
      </h1>
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {/* Keep header row compact */}
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Memo Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesTransactions.length === 0 ? (
                  /* Wrap the empty case row in a Fragment */
                  <>
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No sales transactions found.
                      </TableCell>
                    </TableRow>
                  </>
                ) : (
                  /* Wrap the mapped rows in a Fragment */
                  <>
                    {salesTransactions.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => handleRowClick(t.id)}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="whitespace-nowrap">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {t.memoNumber}
                        </TableCell>
                        <TableCell>{t.customerName}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(t.total)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 whitespace-nowrap">
                          {formatCurrency(
                            t.totalCost
                              ? (t.total || 0) - (t.totalCost || 0)
                              : 0
                          )}
                        </TableCell>
                        <TableCell className="text-right text-red-600 whitespace-nowrap">
                          {formatCurrency(t.due)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={t.due > 0 ? "destructive" : "default"}
                          >
                            {t.due > 0 ? "Due" : "Paid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => e.stopPropagation()}
                                disabled={loadingActions}
                              >
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">More actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-500 focus:bg-red-50"
                                onClick={(e) => handleDelete(e, t.id)}
                                disabled={loadingActions}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
