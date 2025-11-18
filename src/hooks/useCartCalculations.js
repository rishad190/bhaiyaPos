"use client";
import { useMemo } from "react";

/**
 * Custom hook to calculate cart totals
 * @param {Array} products - Array of products in the cart
 * @returns {Object} - { grandTotal, totalCost, totalProfit, itemCount }
 */
export function useCartCalculations(products = []) {
  return useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return {
        grandTotal: 0,
        totalCost: 0,
        totalProfit: 0,
        itemCount: 0,
      };
    }

    const grandTotal = products.reduce(
      (sum, product) => sum + (Number(product.total) || 0),
      0
    );

    const totalCost = products.reduce(
      (sum, product) => sum + (Number(product.cost) || 0),
      0
    );

    const totalProfit = grandTotal - totalCost;

    const itemCount = products.reduce(
      (sum, product) => sum + (Number(product.quantity) || 0),
      0
    );

    return {
      grandTotal,
      totalCost,
      totalProfit,
      itemCount,
    };
  }, [products]);
}
