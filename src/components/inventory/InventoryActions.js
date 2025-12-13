import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function InventoryActions({ searchTerm, onSearchChange, onAddClick }) {
  return (
    <CardHeader>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Fabric Inventory
          </CardTitle>
          <CardDescription className="mt-1">
            Manage your fabric stock here.
          </CardDescription>
        </div>
        <Button
          onClick={onAddClick}
          className="bg-primary hover:bg-primary/90 text-white w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Fabric
        </Button>
      </div>

      <div className="mt-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or category..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </CardHeader>
  );
}
