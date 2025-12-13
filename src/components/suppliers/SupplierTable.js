import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

export function SupplierTable({ suppliers, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Supplier Name</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Store</TableHead>
          <TableHead className="text-right">Total Due</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow
            key={supplier.id}
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(`/suppliers/${supplier.id}`)}
          >
            <TableCell>
              <div className="font-medium">{supplier.name}</div>
            </TableCell>
            <TableCell>
              <div>{supplier.phone}</div>
              <div className="text-sm text-gray-500">{supplier.email}</div>
            </TableCell>
            <TableCell>
              <div className="truncate max-w-[200px]" title={supplier.address}>
                {supplier.address}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{supplier.storeId}</Badge>
            </TableCell>
            <TableCell
              className={`text-right ${
                (supplier.totalDue || 0) > 0 ? "text-red-500" : "text-green-500"
              }`}
            >
              ৳{(Number(supplier.totalDue) || 0).toLocaleString()}
            </TableCell>
            <TableCell>
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(supplier);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/suppliers/${supplier.id}`);
                      }}
                    >
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={(e) => onDelete(e, supplier.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {!suppliers.length && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4">
              No suppliers found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
