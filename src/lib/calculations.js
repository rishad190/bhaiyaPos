export function calculateDailyCashBook(transactions, cashEntries) {
  // Combine both transactions and manual entries
  const allEntries = [
    ...transactions.map((t) => ({
      date: t.date,
      description: `Customer Payment - ${t.memoNumber}`,
      cashIn: t.deposit || 0,
      cashOut: 0,
      transactionId: t.id,
      customerId: t.customerId,
    })),
    ...cashEntries,
  ];

  // Group by date and calculate totals
  const dailySummary = allEntries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        cashIn: 0,
        cashOut: 0,
        transactions: [],
      };
    }

    acc[date].cashIn += entry.cashIn;
    acc[date].cashOut += entry.cashOut;
    acc[date].transactions.push(entry);

    return acc;
  }, {});

  // Sort dates and calculate running balance
  const sortedDates = Object.keys(dailySummary).sort();
  let runningBalance = 0;

  return sortedDates.map((date) => {
    const day = dailySummary[date];
    runningBalance += day.cashIn - day.cashOut;

    return {
      ...day,
      balance: runningBalance,
      transactions: day.transactions.sort((a, b) =>
        a.description.localeCompare(b.description)
      ),
    };
  });
}
