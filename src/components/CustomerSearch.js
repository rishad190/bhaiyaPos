import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function CustomerSearch({
  searchTerm,
  onSearchChange,
  selectedFilter,
  onFilterChange,
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Search Customers</CardTitle>
        <CardDescription>
          Find customers by name or phone number
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search customers..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-4 py-2 bg-background"
          value={selectedFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="all">All Customers</option>
          <option value="due">With Due Amount</option>
          <option value="paid">No Due Amount</option>
        </select>
      </CardContent>
    </Card>
  );
}
