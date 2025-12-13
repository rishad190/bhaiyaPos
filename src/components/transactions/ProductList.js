import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatProductWithColor } from "@/lib/color-utils";
import { Input } from "@/components/ui/input";

export function ProductList({
  products,
  onDelete,
  memoData,
  setMemoData,
  grandTotal,
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">#</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatProductWithColor(product)}
                </span>
                {product.unit && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({product.unit})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">{product.quantity}</TableCell>
              <TableCell className="text-right">৳{product.price}</TableCell>
              <TableCell className="text-right">
                ৳{product.total.toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center h-24 text-muted-foreground"
              >
                No products added yet
              </TableCell>
            </TableRow>
          )}
          {products.length > 0 && (
            <>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">
                  Grand Total
                </TableCell>
                <TableCell className="text-right">
                  ৳{grandTotal.toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right align-middle">
                  Deposit / Paid
                </TableCell>
                <TableCell className="text-right p-2">
                  <Input
                    type="number"
                    value={memoData.deposit}
                    onChange={(e) =>
                      setMemoData({ ...memoData, deposit: e.target.value })
                    }
                    className="w-24 ml-auto text-right h-8"
                    placeholder="0"
                  />
                </TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="font-bold">
                <TableCell colSpan={4} className="text-right">
                  Due Amount
                </TableCell>
                <TableCell
                  className={`text-right ${
                    grandTotal - (Number(memoData.deposit) || 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  ৳
                  {(
                    grandTotal - (Number(memoData.deposit) || 0)
                  ).toLocaleString()}
                </TableCell>
                <TableCell />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
