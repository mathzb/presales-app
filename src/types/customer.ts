export interface Address {
  streetName: string;
  streetName2: string;
  city: string;
  region: string;
  postalCode: string;
  countryCode: string;
}

export interface Customer {
  legacyId: number;
  id: string;
  name: string;
  email: string;
  vatId: string;
  phone: string;
  countryCode: string;
  address: Address;
  partnerLegacyId: number;
  partnerId: string;
  externalServices: Record<string, string>;
  tags: string[];
  customerReference: string;
  displayCurrency: string;
  invoiceCurrency: string;
  invoiceContactName: string;
  invoiceEmail: string;
}

export interface CustomersMetadata {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface CustomersReferences {
  currentPage: string;
  nextPage: string;
  previousPage: string;
}

export interface CustomersResponse {
  metadata: CustomersMetadata;
  results: Customer[];
  references: CustomersReferences;
}
