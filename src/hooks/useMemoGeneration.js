"use client";
import { useCallback } from "react";

/**
 * Custom hook for memo generation and transaction payload creation
 * @returns {Object} - { generateMemoNumber, createTransactionPayload }
 */
export function useMemoGeneration() {
  /**
   * Generate a unique memo number
   * @returns {string} - Memo number in format MEMO-timestamp
   */
  const generateMemoNumber = useCallback(() => {
    const timestamp = Date.now();
    return `MEMO-${timestamp}`;
  }, []);

  /**
   * Create transaction payload from memo data
   * @param {Object} memoData - Memo form data
   * @param {Array} products - Products in the cart
   * @param {number} grandTotal - Total amount
   * @param {number} totalCost - Total cost
   * @param {number} totalProfit - Total profit
   * @returns {Object} - Transaction payload ready for Firebase
   */
  const createTransactionPayload = useCallback(
    (memoData, products, grandTotal, totalCost, totalProfit) => {
      const deposit = Number(memoData.deposit) || 0;
      const due = grandTotal - deposit;

      return {
        customerId: memoData.customerId,
        customerName: memoData.customerName,
        customerPhone: memoData.customerPhone,
        customerAddress: memoData.customerAddress,
        date: memoData.date,
        memoNumber: memoData.memoNumber,
        products: products.map((p) => ({
          fabricId: p.fabricId,
          name: p.name,
          color: p.color,
          colorCode: p.colorCode,
          quantity: Number(p.quantity),
          price: Number(p.price),
          total: Number(p.total),
          cost: Number(p.cost),
          profit: Number(p.profit),
        })),
        total: grandTotal,
        totalCost: totalCost,
        totalProfit: totalProfit,
        deposit: deposit,
        due: due,
        storeId: memoData.storeId || "STORE1",
        createdAt: new Date().toISOString(),
      };
    },
    []
  );

  /**
   * Create daily cash transaction payload
   * @param {Object} memoData - Memo form data
   * @param {number} deposit - Deposit amount
   * @returns {Object} - Daily cash transaction payload
   */
  const createDailyCashPayload = useCallback((memoData, deposit) => {
    return {
      date: memoData.date,
      type: "sale",
      description: `Sale - ${memoData.memoNumber}`,
      reference: memoData.memoNumber,
      cashIn: deposit,
      cashOut: 0,
      storeId: memoData.storeId || "STORE1",
      createdAt: new Date().toISOString(),
    };
  }, []);

  return {
    generateMemoNumber,
    createTransactionPayload,
    createDailyCashPayload,
  };
}
