'use client';
import { useTransactionData } from "@/contexts/TransactionContext";
import { useCustomerData } from "@/contexts/CustomerContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfitDetailsPage() {
  const { transactions } = useTransactionData();
  const { customers } = useCustomerData();

  const profitableTransactions = transactions
    .filter((t) => t.totalCost && t.total > t.totalCost)
    .map((t) => ({
      ...t,
      profit: t.total - t.totalCost,
      customerName: customers.find((c) => c.id === t.customerId)?.name || "N/A",
      status: t.due === 0 ? "Paid" : "Due",
    }));

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Memo No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profitableTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>{t.memoNumber}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="text-right">৳{t.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">৳{t.profit.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={t.status === "Paid" ? "default" : "destructive"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
