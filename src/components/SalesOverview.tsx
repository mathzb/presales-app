import { useEffect, useState, useMemo } from "react";
import { TrendingUp, Users, DollarSign, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCustomers } from "../hooks/useCustomers";
import { useProducts } from "../hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "../utils/currency";
import { logger } from "../utils/logger";
import type { ProductResult } from "../types/product";

interface CustomerSalesData {
  customerId: string;
  customerName: string;
  totalSales: number;
  subscriptionCount: number;
}

interface Subscription {
  id: string;
  name: string;
  nickname?: string;
  quantity: number;
  sku: string;
  status: string;
  catalogueId?: string; // Direct field on subscription
  billingCycle?: string;
  termDuration?: string;
  renewal?: {
    product?: {
      catalogueId?: string;
    };
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow additional fields from API
}

export default function SalesOverview() {
  const log = logger.createScopedLogger("SalesOverview");
  const { accessToken } = useAuth();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const [salesData, setSalesData] = useState<CustomerSalesData[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  const [currency] = useState("DKK");
  const [showYearly, setShowYearly] = useState(true); // Toggle between monthly and yearly

  useEffect(() => {
    document.title = "Salgsoversigt - Cloud Factory Presales Portal";
    log.info("SalesOverview component mounted");
    return () => {
      log.debug("SalesOverview component unmounted");
    };
  }, []);

  // Create a map of SKU to product for quick lookups
  const productsBySku = useMemo(() => {
    if (!productsData?.results) return new Map<string, ProductResult>();
    const map = new Map<string, ProductResult>();
    productsData.results.forEach((product: ProductResult) => {
      const sku = product.product.sku;
      if (!sku) return;
      map.set(sku, product);
      map.set(sku.toLowerCase(), product); // case-insensitive
    });

    // Debug: Log sample products with their names
    const sampleProducts = productsData.results.slice(0, 5).map((p) => ({
      sku: p.product.sku,
      name: p.product.name,
      price: p.price.sale,
    }));
    log.info("Product catalog sample", {
      sampleProducts,
      totalProducts: productsData.results.length,
    });

    return map;
  }, [productsData, log]); // Also map by productId for cases where subscriptions expose catalogueId
  const idToProduct = useMemo(() => {
    if (!productsData?.results) return new Map<string, ProductResult>();
    const map = new Map<string, ProductResult>();
    productsData.results.forEach((product: ProductResult) => {
      map.set(product.product.id, product);
    });

    // Debug: Log first few product IDs
    log.debug("Product catalog IDs sample", {
      sampleIDs: Array.from(map.keys()).slice(0, 10),
      totalProducts: map.size,
    });

    return map;
  }, [productsData, log]);
  useEffect(() => {
    const fetchAllSubscriptions = async () => {
      if (
        !customers ||
        !accessToken ||
        !customers.results ||
        customers.results.length === 0 ||
        !productsData ||
        productsBySku.size === 0
      )
        return;

      setIsLoadingSubscriptions(true);
      log.info("Fetching subscriptions for all customers", {
        customerCount: customers.results.length,
      });

      try {
        const salesPromises = customers.results.map(async (customer) => {
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/microsoft/customer/${
                customer.id
              }/subscriptions`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              log.warn("Failed to fetch subscriptions for customer", {
                customerId: customer.id,
                status: response.status,
              });
              return {
                customerId: customer.id,
                customerName: customer.name,
                totalSales: 0,
                subscriptionCount: 0,
              };
            }

            const subscriptions: Subscription[] = await response.json();

            // Filter out deleted subscriptions
            const activeSubscriptions = subscriptions.filter(
              (sub) => sub.status !== "deleted"
            );

            // Debug: Log full first subscription to see ALL available fields
            if (
              activeSubscriptions.length > 0 &&
              customer.id === customers.results[0].id
            ) {
              const firstSub = activeSubscriptions[0];
              log.info("FULL SUBSCRIPTION OBJECT", {
                subscription: JSON.parse(JSON.stringify(firstSub)),
                hasRenewal: !!firstSub.renewal,
                renewalKeys: firstSub.renewal
                  ? Object.keys(firstSub.renewal)
                  : [],
              });
            }

            // Calculate total sales from subscriptions using product pricing
            const totalSales = activeSubscriptions.reduce(
              (sum: number, sub: Subscription) => {
                // Use same matching logic as CustomerDetail component
                let product: ProductResult | undefined;

                // 1) Try exact SKU match (case-insensitive)
                product =
                  productsBySku.get(sub.sku) ||
                  productsBySku.get(sub.sku.toLowerCase());

                // 2) Try first two parts of SKU (subscriptions are 3-part, products are 2-part)
                if (!product && sub.sku.includes(":")) {
                  const parts = sub.sku.split(":");
                  if (parts.length >= 2) {
                    const firstTwoParts = `${parts[0]}:${parts[1]}`;
                    product =
                      productsBySku.get(firstTwoParts) ||
                      productsBySku.get(firstTwoParts.toLowerCase());
                    if (product) {
                      log.debug("Matched by first two SKU parts", {
                        subscriptionSku: sub.sku,
                        matchedSku: firstTwoParts,
                        productName: product.product.name,
                        price: product.price.sale,
                      });
                    }
                  }
                }

                // 3) Try catalogueId if present
                if (!product && sub.catalogueId && sub.catalogueId !== "N/A") {
                  product = idToProduct.get(sub.catalogueId);

                  if (!product) {
                    product =
                      productsBySku.get(sub.catalogueId) ||
                      productsBySku.get(sub.catalogueId.toLowerCase());
                  }

                  // Try first two parts of catalogueId
                  if (!product && sub.catalogueId.includes(":")) {
                    const parts = sub.catalogueId.split(":");
                    if (parts.length >= 2) {
                      const firstTwoParts = `${parts[0]}:${parts[1]}`;
                      product =
                        productsBySku.get(firstTwoParts) ||
                        productsBySku.get(firstTwoParts.toLowerCase());
                    }
                  }
                }

                // 3) Try renewal.product.catalogueId (fallback)
                if (!product) {
                  const renewalCatalogueId = sub.renewal?.product?.catalogueId;
                  if (renewalCatalogueId) {
                    product = idToProduct.get(renewalCatalogueId);
                  }
                }

                if (product) {
                  // Calculate sales price (same logic as OverallCalculator)
                  const baseSalePrice = product.price.sale;
                  const recursionTerm = product.product.recursionTerm;

                  // Convert to yearly or monthly price based on recursion term and showYearly setting
                  let pricePerUnit: number;
                  if (showYearly) {
                    // Yearly price
                    pricePerUnit =
                      recursionTerm >= 12
                        ? baseSalePrice
                        : recursionTerm > 0
                        ? baseSalePrice * (12 / recursionTerm)
                        : baseSalePrice;
                  } else {
                    // Monthly price
                    pricePerUnit =
                      recursionTerm >= 12
                        ? baseSalePrice / 12
                        : recursionTerm > 0
                        ? baseSalePrice / recursionTerm
                        : baseSalePrice;
                  }

                  const totalSales = pricePerUnit * sub.quantity;
                  return sum + totalSales;
                } else {
                  log.warn("No product found for subscription", {
                    sku: sub.sku,
                    subscriptionName: sub.name,
                    catalogueId: sub.catalogueId || "N/A",
                  });
                }
                return sum;
              },
              0
            );

            // Calculate total license count (sum of all quantities)
            const totalLicenses = activeSubscriptions.reduce(
              (sum: number, sub: Subscription) => sum + sub.quantity,
              0
            );

            log.debug("Calculated sales for customer", {
              customerId: customer.id,
              customerName: customer.name,
              totalSales,
              subscriptionCount: totalLicenses,
            });

            return {
              customerId: customer.id,
              customerName: customer.name,
              totalSales,
              subscriptionCount: totalLicenses,
            };
          } catch (error) {
            log.error("Error fetching subscriptions for customer", {
              customerId: customer.id,
              error,
            });
            return {
              customerId: customer.id,
              customerName: customer.name,
              totalSales: 0,
              subscriptionCount: 0,
            };
          }
        });

        const results = await Promise.all(salesPromises);

        // Sort by total sales descending
        const sortedResults = results.sort(
          (a: CustomerSalesData, b: CustomerSalesData) =>
            b.totalSales - a.totalSales
        );

        setSalesData(sortedResults);

        log.info("Sales data loaded successfully", {
          totalCustomers: sortedResults.length,
          totalRevenue: sortedResults.reduce((sum, c) => sum + c.totalSales, 0),
        });
      } catch (error) {
        log.error("Error fetching sales data", { error });
      } finally {
        setIsLoadingSubscriptions(false);
      }
    };

    fetchAllSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, accessToken, productsData, showYearly]);

  const totalRevenue = salesData.reduce(
    (sum: number, customer: CustomerSalesData) => sum + customer.totalSales,
    0
  );
  const totalSubscriptions = salesData.reduce(
    (sum: number, customer: CustomerSalesData) =>
      sum + customer.subscriptionCount,
    0
  );
  const customersWithSales = salesData.filter((c) => c.totalSales > 0).length;

  const isLoading =
    customersLoading || isLoadingSubscriptions || productsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-pink-600/10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" />
              Salgsoversigt
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
              Kundesalg oversigt
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-100 max-w-2xl mx-auto mb-6">
              Total oversigt over licenssalg pr. kunde
            </p>

            {/* Toggle between monthly and yearly */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowYearly(!showYearly)}
                variant="secondary"
                size="lg"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/20 shadow-lg hover:shadow-xl"
              >
                <TrendingUp className="w-5 h-5" />
                {showYearly ? "Årlig visning" : "Månedlig visning"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="relative overflow-hidden hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Omsætning ({showYearly ? "Årlig" : "Månedlig"})
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    Indlæser...
                  </span>
                ) : (
                  formatCurrency(totalRevenue, currency)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fra alle kunder
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Aktive Kunder
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    ...
                  </span>
                ) : (
                  customersWithSales
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Med aktive licenser
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Licenser
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Users className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    ...
                  </span>
                ) : (
                  totalSubscriptions
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Abonnementer</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-lg transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gns. pr. Kunde
              </CardTitle>
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <span className="text-slate-400 dark:text-slate-500">
                    ...
                  </span>
                ) : (
                  formatCurrency(
                    customersWithSales > 0
                      ? totalRevenue / customersWithSales
                      : 0,
                    currency
                  )
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Gennemsnitlig omsætning
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Kundeliste</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400">
                  Indlæser salgsdata...
                </p>
              </div>
            ) : salesData.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-600 dark:text-slate-400">
                  Ingen kundedata tilgængelig
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>Kundenavn</TableHead>
                      <TableHead className="text-center">Licenser</TableHead>
                      <TableHead className="text-right">Total Salg</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((customer, index) => (
                      <TableRow key={customer.customerId}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {customer.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {customer.customerId}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {customer.subscriptionCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(customer.totalSales, currency)}
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.totalSales > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-slate-500 dark:text-slate-400"
                            >
                              Ingen salg
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-bold">
                        TOTAL
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {totalSubscriptions}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-700 dark:text-purple-300 text-lg">
                        {formatCurrency(totalRevenue, currency)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
