import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  isWithinInterval,
} from "date-fns";

export const calculateProfit = (transactions) => {
  const now = new Date();

  const weeklyProfit = calculatePeriodProfit(transactions, startOfWeek(now));
  const monthlyProfit = calculatePeriodProfit(transactions, startOfMonth(now));
  const yearlyProfit = calculatePeriodProfit(transactions, startOfYear(now));

  return {
    weekly: weeklyProfit,
    monthly: monthlyProfit,
    yearly: yearlyProfit,
  };
};

const calculatePeriodProfit = (transactions, startDate) => {
  const endDate = new Date();

  const { totalRevenue, totalCost } = transactions.reduce(
    (acc, t) => {
      const transactionDate = new Date(t.date);
      if (
        (t.type === "SALE" || t.type === "FABRIC_SALE") &&
        !isNaN(transactionDate.getTime()) &&
        isWithinInterval(transactionDate, { start: startDate, end: endDate })
      ) {
        acc.totalRevenue += t.total || 0;
        acc.totalCost += t.totalCost || 0;
      }
      return acc;
    },
    { totalRevenue: 0, totalCost: 0 }
  );

  return totalRevenue - totalCost;
};
