'use client';
import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/app/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InventoryProfitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { transactions, customers } = useData();

  const transaction = useMemo(() => {
    const trans = transactions.find((t) => t.id === id);
    if (trans) {
      const customer = customers.find((c) => c.id === trans.customerId);
      return { ...trans, customerName: customer ? customer.name : 'N/A', customerAddress: customer ? customer.address : 'N/A' };
    }
    return null;
  }, [transactions, customers, id]);

  if (!transaction) {
    return <div>Transaction not found</div>;
  }

  const profit = transaction.totalCost ? transaction.total - transaction.totalCost : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Button
            variant="outline"
            onClick={() => router.push("/inventory-profit")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory Profit
        </Button>
      <Card>
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <p className="text-sm text-muted-foreground">Memo Number</p>
                <p>{transaction.memoNumber}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p>{formatDate(transaction.date)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p>{transaction.customerName}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p>{transaction.customerAddress}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p>{formatCurrency(transaction.total)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Profit</p>
                <p className="text-green-600">{formatCurrency(profit)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Deposit</p>
                <p>{formatCurrency(transaction.deposit)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Due</p>
                <p className="text-red-600">{formatCurrency(transaction.due)}</p>
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={transaction.due > 0 ? 'destructive' : 'default'}>
                    {transaction.due > 0 ? 'Due' : 'Paid'}
                </Badge>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Products</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quality</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transaction.details.split(', ').map((detail, index) => {
                        const parts = detail.match(/(.*) \((\d+\.?\d*|\d+) x ৳(\d+\.?\d*|\d+)\)/);
                        if (!parts) return null;
                        const [, name, quality, price] = parts;
                        const total = parseFloat(quality) * parseFloat(price);
                        return (
                            <TableRow key={index}>
                                <TableCell>{name}</TableCell>
                                <TableCell className="text-right">{quality}</TableCell>
                                <TableCell className="text-right">{formatCurrency(price)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
