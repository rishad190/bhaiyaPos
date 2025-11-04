"use client";
import React, { useMemo } from "react";
import { useData } from "@/app/data-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function InventoryProfitPage() {
  const { fabrics, transactions } = useData();

  const inventoryProfit = useMemo(() => {
    if (!fabrics || !transactions) return [];

    return fabrics.map((fabric) => {
      const fabricTransactions = transactions.filter((t) =>
        t.products?.some((p) => p.fabricId === fabric.id)
      );

      let totalQuantitySold = 0;
      let totalProfit = 0;

      fabricTransactions.forEach((t) => {
        t.products?.forEach((p) => {
          if (p.fabricId === fabric.id) {
            totalQuantitySold += p.quantity || 0;
            totalProfit += p.profit || 0;
          }
        });
      });

      return {
        ...fabric,
        totalQuantitySold,
        totalProfit,
      };
    });
  }, [fabrics, transactions]);

  const totalInventoryProfit = useMemo(() => {
    return inventoryProfit.reduce((acc, item) => acc + item.totalProfit, 0);
  }, [inventoryProfit]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Inventory Profit
      </h1>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Inventory Profit
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ৳{totalInventoryProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profit by Fabric</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fabric Name</TableHead>
                <TableHead>Fabric Code</TableHead>
                <TableHead className="text-right">Total Quantity Sold</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryProfit.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell className="text-right">
                    {item.totalQuantitySold.toFixed(2)} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    ৳{item.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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