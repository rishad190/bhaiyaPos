'use client';
import { useState, useMemo } from 'react';
import { useData } from '@/app/data-context';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InventoryProfitPage() {
  const { transactions, customers } = useData();
  const router = useRouter();

  const salesTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'SALE')
      .map((t) => {
        const customer = customers.find((c) => c.id === t.customerId);
        return { ...t, customerName: customer ? customer.name : 'N/A' };
      });
  }, [transactions, customers]);

  const handleRowClick = (transactionId) => {
    router.push(`/inventory-profit/${transactionId}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Inventory Profit</h1>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Memo Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesTransactions.map((t) => (
                <TableRow key={t.id} onClick={() => handleRowClick(t.id)} className="cursor-pointer">
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>{t.memoNumber}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(t.total)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(t.totalCost ? t.total - t.totalCost : 0)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(t.due)}</TableCell>
                  <TableCell>
                    <Badge variant={t.due > 0 ? 'destructive' : 'default'}>
                      {t.due > 0 ? 'Due' : 'Paid'}
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
