export interface Product {
  id: string;
  ownerId: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string;
  tags: string[];
  deprecated: boolean;
  recursionTerm: number;
  billingTerm: number;
  attributes: Record<string, string>;
  rank: number;
}

export interface Price {
  productId: string;
  currency: string;
  cost: number;
  sale: number;
  discount: number;
  discountType: string;
  customerAdjustments?: Record<string, unknown>;
}

export interface Promotion {
  id: string;
  promotionId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isAutoApplicable: boolean;
  value: number;
  productId: string;
  createdAt: string;
  modifiedAt: string;
}

export interface ProductResult {
  product: Product;
  price: Price;
  promotions: Promotion[];
}

export interface Metadata {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface References {
  currentPage: string;
  nextPage: string;
  previousPage: string;
}

export interface ProductsResponse {
  metadata: Metadata;
  results: ProductResult[];
  references: References;
}

export interface CartItem {
  productResult: ProductResult;
  quantity: number;
  discount: number;
}
