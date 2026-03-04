import type { ProductResult } from "../types/product";

/**
 * Get maximum quantity allowed for a product from its attributes
 */
export const getMaxQuantity = (productResult: ProductResult): number | null => {
  const maxQuantityStr = productResult.product.attributes?.["maximum-quantity"];
  if (!maxQuantityStr) return null;
  const maxQuantity = parseInt(maxQuantityStr, 10);
  return isNaN(maxQuantity) ? null : maxQuantity;
};
