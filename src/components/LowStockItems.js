'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export function LowStockItems({ items }) {
  const router = useRouter();

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>Items that need attention</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/inventory")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((fabric) => (
              <div
                key={fabric.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div>
                  <p className="font-medium">{fabric.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Code: {fabric.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{fabric.totalQuantity} units</p>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No low stock items
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
