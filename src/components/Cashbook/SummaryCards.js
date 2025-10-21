'use client';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

export function SummaryCards({ financials }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="overflow-hidden border-none shadow-md">
        <CardContent className="p-0">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-800">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                Total Cash In
              </h3>
              <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="p-4">
            <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
              ৳{financials.totalCashIn.toLocaleString()}
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
              All time income
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md">
        <CardContent className="p-0">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-800">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Total Cash Out
              </h3>
              <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="p-4">
            <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
              ৳{financials.totalCashOut.toLocaleString()}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">
              All time expenses
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none shadow-md">
        <CardContent className="p-0">
          <div
            className={`${financials.availableCash >= 0
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
              } p-4 border-b`}
          >
            <div className="flex justify-between items-center">
              <h3
                className={`text-sm font-medium ${financials.availableCash >= 0
                    ? 'text-blue-800 dark:text-blue-300'
                    : 'text-amber-800 dark:text-amber-300'
                  }`}
              >
                Available Balance
              </h3>
              <RefreshCw
                className={`h-4 w-4 ${financials.availableCash >= 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-amber-600 dark:text-amber-400'
                  }`}
              />
            </div>
          </div>
          <div className="p-4">
            <p
              className={`text-2xl md:text-3xl font-bold ${financials.availableCash >= 0
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-amber-600 dark:text-amber-400'
                }`}
            >
              ৳{financials.availableCash.toLocaleString()}
            </p>
            <p
              className={`text-xs ${financials.availableCash >= 0
                  ? 'text-blue-600/70 dark:text-blue-400/70'
                  : 'text-amber-600/70 dark:text-amber-400/70'
                } mt-1`}
            >
              Current balance
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
