import { calculateDailyCashBook } from "./calculations";

export function generateCashFlowStatement(transactions, cashEntries) {
  const dailyCash = calculateDailyCashBook(transactions, cashEntries);

  return {
    totalCashIn: dailyCash.reduce((sum, day) => sum + day.cashIn, 0),
    totalCashOut: dailyCash.reduce((sum, day) => sum + day.cashOut, 0),
    closingBalance:
      dailyCash.length > 0 ? dailyCash[dailyCash.length - 1].balance : 0,
    dailyBreakdown: dailyCash,
  };
}

export function generateFinancialSummary(transactions, cashEntries) {
  const cashFlow = generateCashFlowStatement(transactions, cashEntries);
  const totalReceivables = transactions.reduce(
    (sum, t) => sum + (parseFloat(t.total || 0) - parseFloat(t.deposit || 0)),
    0
  );

  return {
    ...cashFlow,
    totalReceivables,
    availableCash: cashFlow.closingBalance,
    totalAssets: cashFlow.closingBalance + totalReceivables,
  };
}
