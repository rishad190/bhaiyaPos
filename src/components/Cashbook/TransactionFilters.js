'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, X } from 'lucide-react';

export function TransactionFilters({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
}) {
  return (
    <Card className="mb-8 border-none shadow-md">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-9 w-full md:w-[200px]"
              />
            </div>
            {dateFilter && (
              <Button
                variant="outline"
                onClick={() => setDateFilter('')}
                className="w-full md:w-auto"
                size="icon"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear Date</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
