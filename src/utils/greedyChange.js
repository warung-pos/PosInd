/**
 * Calculates the optimal bill and coin breakdown using a Greedy approach.
 * @param {number} amount - The change amount in IDR
 * @returns {Array<{denomination: number, count: number}>} Array of denominations and their counts
 */
export const getGreedyChange = (amount) => {
  if (amount <= 0) return [];
  
  // Standard Indonesian Rupiah denominations (paper and coins)
  const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];
  const result = [];
  let remaining = Math.round(amount);

  for (const bill of denominations) {
    if (remaining >= bill) {
      const count = Math.floor(remaining / bill);
      remaining = remaining % bill;
      result.push({ denomination: bill, count });
    }
  }
  
  return result;
};
