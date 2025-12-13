import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { calculateTotalQuantity } from "@/lib/inventory-utils";
import logger from "@/utils/logger";
import { useRouter } from "next/navigation";

export function InventoryTable({ fabrics, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Current Stock</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fabrics.map((fabric) => (
          <TableRow
            key={fabric.id}
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              logger.info(
                "Row clicked - Navigating to fabric:",
                fabric.id
              );
              router.push(`/inventory/${fabric.id}`);
            }}
          >
            <TableCell className="font-medium">
              <div>{fabric.name}</div>
              {fabric.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {fabric.description}
                </div>
              )}
            </TableCell>
            <TableCell>{fabric.code}</TableCell>
            <TableCell>{fabric.category}</TableCell>
            <TableCell className="text-right">
              {fabric.batches ? calculateTotalQuantity(fabric).toFixed(2) : '0.00'}{" "}
              {fabric.unit || "pieces"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from firing
                    logger.info(
                      "View button clicked - Navigating to fabric:",
                      fabric.id
                    );
                    router.push(`/inventory/${fabric.id}`);
                  }}
                >
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from firing
                    logger.info("Edit button clicked");
                    onEdit(fabric);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent row click from firing
                    logger.info("Delete button clicked");
                    onDelete(fabric.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}

        {!fabrics.length && (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center py-8 text-muted-foreground"
            >
              No fabrics found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
