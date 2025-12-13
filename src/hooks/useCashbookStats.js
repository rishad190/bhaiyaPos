import { useMemo } from "react";
import { calculateDailyCashBook } from "@/lib/calculations";

/**
 * Hook to calculate cashbook statistics and daily summaries
 * @param {Array} dailyCashTransactions - Array of cash transactions
 * @param {string} date - Current date filter
 * @param {string} searchTerm - Search term filter
 */
export function useCashbookStats({ dailyCashTransactions = [], date, searchTerm }) {
  // Calculate opening balance
  const openingBalance = useMemo(() => {
    if (date && dailyCashTransactions.length > 0) {
      const targetDate = new Date(date);
      // Logic to sum up all transactions BEFORE this date
      const previousTransactions = dailyCashTransactions.filter(t => t.date < date);
      return previousTransactions.reduce((acc, t) => acc + (Number(t.cashIn) || 0) - (Number(t.cashOut) || 0), 0);
    }
    return 0;
  }, [date, dailyCashTransactions]);

  // Calculate daily stats and grouped transactions for summary view
  const { dailyCash, financials, monthlyTotals } = useMemo(() => {
    if (!dailyCashTransactions.length) {
      return {
        dailyCash: [],
        financials: { totalCashIn: 0, totalCashOut: 0, availableCash: 0 },
        monthlyTotals: [],
      };
    }

    const dailySummary = dailyCashTransactions.reduce((acc, item) => {
      if (!item?.date) return acc;

      const dateKey = item.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          cashIn: 0,
          cashOut: 0,
          balance: 0,
          dailyCash: [],
        };
      }

      const cashIn = Number(item.cashIn) || 0;
      const cashOut = Number(item.cashOut) || 0;

      acc[dateKey].cashIn += cashIn;
      acc[dateKey].cashOut += cashOut;
      acc[dateKey].balance = acc[dateKey].cashIn - acc[dateKey].cashOut;
      acc[dateKey].dailyCash.push(item);

      return acc;
    }, {});

    const dailyCashList = Object.values(dailySummary).sort(
      (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
    );

    const calcFinancials = {
      totalCashIn: dailyCashTransactions.reduce((sum, t) => sum + (Number(t.cashIn) || 0), 0),
      totalCashOut: dailyCashTransactions.reduce((sum, t) => sum + (Number(t.cashOut) || 0), 0),
      availableCash: dailyCashTransactions.reduce(
        (sum, t) => sum + ((Number(t.cashIn) || 0) - (Number(t.cashOut) || 0)),
        0
      ),
    };

    const monthly = dailyCashTransactions.reduce((acc, transaction) => {
      if (!transaction?.date) return acc;
      const month = transaction.date.substring(0, 7);
      if (!acc[month]) acc[month] = { cashIn: 0, cashOut: 0 };
      acc[month].cashIn += Number(transaction.cashIn) || 0;
      acc[month].cashOut += Number(transaction.cashOut) || 0;
      return acc;
    }, {});

    const monthlyList = Object.entries(monthly)
      .map(([month, totals]) => ({
        month,
        ...totals,
        balance: totals.cashIn - totals.cashOut,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return { dailyCash: dailyCashList, financials: calcFinancials, monthlyTotals: monthlyList };
  }, [dailyCashTransactions]);

  // Calculate grouped entries for the main list view (with filtering)
  const { groupedEntries, sortedDates } = useMemo(() => {
    if (!Array.isArray(dailyCashTransactions)) {
      return { groupedEntries: {}, sortedDates: [] };
    }

    let filteredTransactions = dailyCashTransactions;

    if (date) {
      filteredTransactions = filteredTransactions.filter(
        (transaction) => transaction.date === date
      );
    }

    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const grouped = filteredTransactions.reduce((acc, entry) => {
      const entryDate = entry.date;
      if (!acc[entryDate]) {
        acc[entryDate] = { income: [], expense: [] };
      }
      if (entry.cashIn > 0) {
        acc[entryDate].income.push({ ...entry, amount: entry.cashIn });
      }
      if (entry.cashOut > 0) {
        acc[entryDate].expense.push({ ...entry, amount: entry.cashOut });
      }
      return acc;
    }, {});

    const sorted = Object.keys(grouped).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    let runningBalance = openingBalance;
    
    sorted.forEach((d) => {
        const { income, expense } = grouped[d];
        [...income, ...expense]
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .forEach((entry) => {
            runningBalance += (entry.cashIn || 0) - (entry.cashOut || 0);
            entry.balance = runningBalance;
          });
      });

    return { groupedEntries: grouped, sortedDates: sorted };
  }, [dailyCashTransactions, date, searchTerm, openingBalance]);

  return {
    openingBalance,
    dailyCash,
    financials,
    monthlyTotals,
    groupedEntries,
    sortedDates,
  };
}
