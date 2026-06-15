/**
 * Performs Binary Search on a sorted list of products to find a product by its ID.
 * @param {Array} sortedProducts - Array of products, must be sorted by 'id' in ascending order
 * @param {number} targetId - The ID of the product to find
 * @returns {Object|null} The product object if found, otherwise null
 */
export const binarySearchById = (sortedProducts, targetId) => {
  let left = 0;
  let right = sortedProducts.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midProduct = sortedProducts[mid];
    
    if (midProduct.id === targetId) {
      return midProduct;
    } else if (midProduct.id < targetId) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null; // Product not found
};
