'use client';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ArrowUpDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EditCashTransactionDialog } from '@/components/EditCashTransactionDialog';
import { Pagination } from '@/components/Pagination';

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
  itemsPerPage = 10,
}) {
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="whitespace-nowrap min-w-[100px] cursor-pointer"
                onClick={() => requestSort('date')}
              >
                Date <ArrowUpDown className="inline-block ml-2 h-4 w-4" />
              </TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                Cash In
              </TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                Cash Out
              </TableHead>
              <TableHead className="text-right whitespace-nowrap min-w-[100px]">
                Balance
              </TableHead>
              <TableHead className="whitespace-nowrap min-w-[200px]">
                Details
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.map((day) => (
              <TableRow key={day.date} className="border-b">
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(day.date)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-green-600">
                  ৳{day.cashIn.toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-red-600">
                  ৳{day.cashOut.toLocaleString()}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-medium">
                  ৳{day.balance.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {day.dailyCash.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              t.cashIn > 0
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                            }
                          >
                            {t.cashIn > 0 ? 'In' : 'Out'}
                          </Badge>
                          <span className="font-medium">{t.description}</span>
                          <span
                            className={`${t.cashIn > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                              } text-sm font-medium`}
                          >
                            ৳
                            {t.cashIn > 0
                              ? t.cashIn.toLocaleString()
                              : t.cashOut.toLocaleString()}
                          </span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(t);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(t.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="block md:hidden">
        {paginatedTransactions.map((day) => (
          <div key={day.date} className="bg-white rounded-lg shadow mb-4">
            <div className="grid grid-cols-2 gap-2 p-4 border-b">
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="font-medium">{formatDate(day.date)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Balance</div>
                <div className="font-medium">
                  ৳{day.balance.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cash In</div>
                <div className="text-green-600">
                  ৳{day.cashIn.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Cash Out</div>
                <div className="text-red-600">
                  ৳{day.cashOut.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {day.dailyCash.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-2 py-2 px-4"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{t.description}</span>
                    <div className="flex gap-2 text-sm">
                      <span
                        className={
                          t.cashIn > 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {t.cashIn > 0 ? '৳+' : '৳-'}
                        {t.cashIn > 0
                          ? t.cashIn.toLocaleString()
                          : t.cashOut.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
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
                            onEdit(t);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(t.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={transactions.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        className="mt-4"
      />
    </div>
  );
}
