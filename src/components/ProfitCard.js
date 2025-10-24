"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/app/data-context";
import { calculateProfit } from "@/lib/profit";

export function ProfitCard() {
  const { transactions } = useData();
  const [activeTab, setActiveTab] = useState('weekly');

  const profitData = calculateProfit(transactions || []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <Link href="/profit-details">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Profit</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            <TabsContent value="weekly">
              <p className="text-2xl font-bold">{formatCurrency(profitData.weekly)}</p>
              <p className="text-xs text-muted-foreground">This week's profit</p>
            </TabsContent>
            <TabsContent value="monthly">
              <p className="text-2xl font-bold">{formatCurrency(profitData.monthly)}</p>
              <p className="text-xs text-muted-foreground">This month's profit</p>
            </TabsContent>
            <TabsContent value="yearly">
              <p className="text-2xl font-bold">{formatCurrency(profitData.yearly)}</p>
              <p className="text-xs text-muted-foreground">This year's profit</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Link>
  );
}