import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  Loader2,
  AlertCircle,
  Globe,
  CheckCircle,
  Clock,
  TrendingUp,
  Server,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomerDetail } from "../hooks/useCustomerDetail";
import { useCustomerSubscriptions } from "../hooks/useCustomerSubscriptions";
import { useCustomerMicrosoftDetail } from "../hooks/useCustomerMicrosoftDetail";
import { useCustomerLicenses } from "../hooks/useCustomerLicenses";
import { useKeepItDevices } from "../hooks/useKeepItDevices";
import { useMemo, useState, useEffect, useRef } from "react";
import { useProducts } from "../hooks/useProducts";
import { useProvisionMicrosoftSubscription } from "../hooks/useProvisionMicrosoftSubscription";
import { useToast } from "../context/ToastContext";
import { getCustomerReferenceName } from "../utils/referenceMap";
import { groupProductsByVariants } from "../utils/productGrouping";
import { logger } from "../utils/logger";
import { useSupabaseAuth } from "../context/SupabaseAuthContext";
import type { ProductResult } from "../types/product";
import {
  monthsFromTermDuration,
  termDurationToCommitment,
  normalizeProductName,
} from "../utils/productHelpers";
import ProvisionModal from "./customer/ProvisionModal";
import SubscriptionCard from "./customer/SubscriptionCard";
import UnassignedLicensesDialog from "./customer/UnassignedLicensesDialog";
import { KeepItDevicesList } from "./customer/KeepItDevicesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const log = logger.createScopedLogger("CustomerDetail");
  const { data: customer, isLoading, error } = useCustomerDetail(customerId!);
  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useCustomerSubscriptions(customerId!);

  const { isAdmin } = useSupabaseAuth();

  const subscriptionStats = useMemo(() => {
    if (!subscriptions)
      return { total: 0, active: 0, trial: 0, totalQuantity: 0 };

    // Exclude deleted subscriptions from stats
    const visibleSubs = subscriptions.filter(
      (s) => (s.status || "").toLowerCase() !== "deleted"
    );

    return {
      total: visibleSubs.length,
      active: visibleSubs.filter((s) => s.status.toLowerCase() === "active")
        .length,
      trial: visibleSubs.filter((s) => s.isTrial).length,
      totalQuantity: visibleSubs.reduce((sum, s) => sum + s.quantity, 0),
    };
  }, [subscriptions]);

  const { data: microsoftCustomer } = useCustomerMicrosoftDetail(customerId!);
  const { data: customerLicenses } = useCustomerLicenses(customerId!);

  // Fetch KeepIt devices for this customer
  const {
    data: keepItDevices,
    isLoading: keepItLoading,
    error: keepItError,
  } = useKeepItDevices(customerId);

  useEffect(() => {
    document.title = `Kunde - ${customer?.name}`;
  }, [customer]);

  // Provisioning related state/hooks (call unconditionally to keep hooks order stable)
  const { data: products } = useProducts();
  const { showToast } = useToast();
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showUnassignedWarning, setShowUnassignedWarning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>(
    undefined
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedVariants, setSelectedVariants] = useState<Map<string, number>>(
    new Map()
  );
  const provisionMutation = useProvisionMicrosoftSubscription(customerId ?? "");

  const PRODUCTS_PER_PAGE = 30;

  // Resolve a ProductResult for a given subscription via SKU, catalogueId, or name+variant match
  type MinimalSubscription =
    | {
        nickname?: string;
        name?: string;
        sku?: string;
        termDuration?: string;
        billingCycle: string;
        renewal?: { product?: { catalogueId?: string } };
      }
    | undefined;

  const resolveProductForSubscription = (
    subscription: MinimalSubscription
  ): ProductResult | undefined => {
    if (!subscription) return undefined;

    const ENABLE_PRICE_DEBUG = false;
    const debug = (msg: string, ctx?: Record<string, unknown>) =>
      ENABLE_PRICE_DEBUG && log.debug(msg, ctx);

    // 1) Try SKU (case-insensitive)
    const bySku =
      (typeof subscription.sku === "string"
        ? skuToProduct.get(subscription.sku)
        : undefined) ||
      (typeof subscription.sku === "string"
        ? skuToProduct.get(subscription.sku.toLowerCase())
        : undefined);
    if (bySku) return bySku;

    // 2) Try catalogueId (renewal.product.catalogueId)
    const catId = subscription?.renewal?.product?.catalogueId;
    if (catId) {
      const byId = idToProduct.get(catId);
      if (byId) return byId;
    }

    // 3) Try matching by base name + variant (commitment + billingCycle)
    const subName = (subscription.nickname || subscription.name || "")
      .toString()
      .trim();
    if (!subName) return undefined;
    const normalizedSub = normalizeProductName(subName);

    let group = groupedProducts.find(
      (g) => normalizeProductName(g.baseName) === normalizedSub
    );
    if (!group) {
      group = groupedProducts.find((g) => {
        const nb = normalizeProductName(g.baseName);
        return nb.includes(normalizedSub) || normalizedSub.includes(nb);
      });
    }
    if (!group) {
      debug("Price resolver: no group match", { subName });
      return undefined;
    }

    const commitment = termDurationToCommitment(subscription.termDuration);
    const billingCycle = subscription.billingCycle;
    const variant =
      group.variants.find(
        (v) => v.commitment === commitment && v.billingCycle === billingCycle
      ) || group.defaultVariant;
    const result = variant?.productResult;
    if (!result) {
      debug("Price resolver: variant found but no productResult", {
        subName,
        commitment,
        billingCycle,
        groupBase: group.baseName,
      });
    }
    return result;
  };

  // Reset modal state helper
  const resetModalState = () => {
    setShowProvisionModal(false);
    setShowUnassignedWarning(false);
    setSearchTerm("");
    setSelectedProduct(undefined);
    setQuantity(1);
    setCurrentPage(1);
  };

  // Check if customer has existing licenses for the selected product
  const checkExistingLicenses = (): {
    total: number;
    consumed: number;
  } | null => {
    if (
      !selectedProduct ||
      !customerLicenses ||
      customerLicenses.length === 0
    ) {
      log.debug("License check skipped", {
        hasSelectedProduct: !!selectedProduct,
        hasLicenses: !!customerLicenses,
        licensesCount: customerLicenses?.length || 0,
      });
      return null;
    }

    const selectedProductResult = allProducts.find(
      (p) => p.product.id === selectedProduct
    );
    if (!selectedProductResult) {
      log.debug("Product not found in allProducts", { selectedProduct });
      return null;
    }

    const productSku = selectedProductResult.product.sku;
    const productName = normalizeProductName(
      selectedProductResult.product.name
    );

    log.debug("Checking for matching license", {
      productSku,
      productName,
      availableLicenses: customerLicenses.map((l) => ({
        sku: l.skuPartNumber,
        displayName: l.displayName,
        total: l.unitDetails.total,
        consumed: l.unitDetails.consumed,
      })),
    });

    // Find matching license by SKU or display name
    const matchingLicense = customerLicenses.find((license) => {
      // Check by SKU/skuPartNumber
      if (license.skuPartNumber === productSku) {
        log.debug("License matched by SKU", {
          productSku,
          licenseSku: license.skuPartNumber,
        });
        return true;
      }

      // Check by normalized display name
      const licenseName = normalizeProductName(license.displayName);
      const matches =
        licenseName === productName ||
        licenseName.includes(productName) ||
        productName.includes(licenseName);

      if (matches) {
        log.debug("License matched by name", {
          productName,
          licenseName,
          licenseDisplayName: license.displayName,
        });
      }

      return matches;
    });

    if (!matchingLicense) {
      log.debug("No matching license found for product", {
        productSku,
        productName,
      });
      return null;
    }

    log.info("Matching license found", {
      skuPartNumber: matchingLicense.skuPartNumber,
      displayName: matchingLicense.displayName,
      total: matchingLicense.unitDetails.total,
      consumed: matchingLicense.unitDetails.consumed,
      unassigned:
        matchingLicense.unitDetails.total -
        matchingLicense.unitDetails.consumed,
    });

    return {
      total: matchingLicense.unitDetails.total,
      consumed: matchingLicense.unitDetails.consumed,
    };
  };

  // Handler to initiate provision (shows warning if needed)
  const handleProvisionClick = () => {
    log.userAction("Provision button clicked", {
      customerId,
      productId: selectedProduct,
      quantity,
    });

    // Validation
    if (!selectedProduct) {
      log.warn("Provision attempted without product selection", { customerId });
      showToast("Vælg et produkt", "error");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      log.warn("Invalid quantity provided", { customerId, quantity });
      showToast("Antal skal være et heltal >= 1", "error");
      return;
    }

    // Check for existing licenses
    const licenseInfo = checkExistingLicenses();
    if (licenseInfo && licenseInfo.total > 0) {
      log.info("Existing licenses found, showing warning", {
        customerId,
        productId: selectedProduct,
        totalLicenses: licenseInfo.total,
        consumedLicenses: licenseInfo.consumed,
        unassignedLicenses: licenseInfo.total - licenseInfo.consumed,
        newQuantity: quantity,
      });
      setShowUnassignedWarning(true);
      return;
    }

    // No existing licenses, proceed directly
    handleProvision();
  };

  // Actual provision handler (called after confirmation or if no warning needed)
  const handleProvision = async () => {
    try {
      log.info("Starting provision", {
        customerId,
        productId: selectedProduct,
        quantity,
      });

      await provisionMutation.mutateAsync([
        {
          catalogueId: selectedProduct!,
          quantity,
          autoRenew: true,
        },
      ]);

      log.info("Provision successful", {
        customerId,
        productId: selectedProduct,
        quantity,
      });
      showToast("Provision lykkedes", "success");
      refetchSubscriptions();
      resetModalState();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Provision fejlede";
      log.error("Provision failed", err as Error, {
        customerId,
        productId: selectedProduct,
        quantity,
      });
      showToast(errorMessage, "error", 5000);
    }
  };

  // Handler for confirming provision after warning
  const handleConfirmProvision = () => {
    log.userAction("User confirmed provision despite existing licenses", {
      customerId,
      productId: selectedProduct,
      quantity,
    });
    setShowUnassignedWarning(false);
    handleProvision();
  };

  const allProducts =
    products?.results.filter(
      (p) => p.product.categoryId === "db584fbc-8a3a-4c68-b486-d9c8764dc10e"
    ) || [];
  const groupedProducts = useMemo(
    () => groupProductsByVariants(allProducts),
    [allProducts]
  );

  // Quick lookup from SKU -> ProductResult (use full products list for better coverage)
  const skuToProduct = useMemo(() => {
    const map = new Map<string, ProductResult>();
    const list = products?.results ?? [];
    for (const pr of list) {
      const sku = pr.product.sku;
      if (!sku) continue;
      map.set(sku, pr);
      map.set(sku.toLowerCase(), pr); // case-insensitive
    }
    return map;
  }, [products]);

  // Also map by productId for cases where subscriptions expose catalogueId
  const idToProduct = useMemo(() => {
    const map = new Map<string, ProductResult>();
    const list = products?.results ?? [];
    for (const pr of list) {
      map.set(pr.product.id, pr);
    }
    return map;
  }, [products]);

  // Group subscriptions into combined cards (by product identity + billing + term)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  );
  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const groupedSubscriptions: Array<{
    key: string;
    items: NonNullable<typeof subscriptions>[number][];
  }> = useMemo(() => {
    type Sub = NonNullable<typeof subscriptions>[number];
    if (!subscriptions || subscriptions.length === 0) return [];

    // Filter out deleted subscriptions
    const visibleSubs = subscriptions.filter(
      (s) => (s.status || "").toLowerCase() !== "deleted"
    );
    if (visibleSubs.length === 0) return [];

    const map = new Map<string, Sub[]>();
    for (const s of visibleSubs) {
      const resolved = resolveProductForSubscription({
        nickname: (s as Sub & { nickname?: string }).nickname,
        name: s.name,
        sku: s.sku,
        termDuration: s.termDuration,
        billingCycle: s.billingCycle,
        renewal: s.renewal?.product?.catalogueId
          ? { product: { catalogueId: s.renewal.product.catalogueId } }
          : undefined,
      });
      const productId = resolved?.product.id || "";
      const catalogueId = s.renewal?.product?.catalogueId || "";
      const sku = (s.sku || "").toLowerCase();
      const withNick = s as Sub & { nickname?: string };
      const nameKey = normalizeProductName(
        withNick.nickname || withNick.name || ""
      );

      const idPart = productId || catalogueId || sku || nameKey || "unknown";
      const billing = (s.billingCycle || "").toLowerCase();
      const termMonths = monthsFromTermDuration(s.termDuration) ?? -1;
      const term = `${termMonths}`;

      const key = `${idPart}|${billing}|${term}`;
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }, [subscriptions, resolveProductForSubscription]);

  type SortKey = "name" | "status" | "renewal";
  const [sortBy, setSortBy] = useState<SortKey>("name");

  // Sort groups dynamically based on chosen key
  const sortedGroupedSubscriptions = useMemo(() => {
    const arr = [...groupedSubscriptions];
    const norm = (s?: string) => (s ?? "").toLowerCase();
    const statusRank = (s?: string) => (norm(s) === "active" ? 0 : 1);
    const nextRenewal = (
      items: NonNullable<typeof subscriptions>[number][]
    ): number => {
      let best = Number.POSITIVE_INFINITY;
      for (const it of items) {
        if (it.commitmentEndDate) {
          const t = new Date(it.commitmentEndDate).getTime();
          if (!Number.isNaN(t) && t < best) best = t;
        }
      }
      return best;
    };
    arr.sort((a, b) => {
      const ra = a.items[0];
      const rb = b.items[0];
      const nameA = norm((ra as { nickname?: string }).nickname || ra.name);
      const nameB = norm((rb as { nickname?: string }).nickname || rb.name);
      const srA = statusRank(ra.status);
      const srB = statusRank(rb.status);
      const rA = nextRenewal(a.items);
      const rB = nextRenewal(b.items);

      if (sortBy === "name") {
        const nameCmp = nameA.localeCompare(nameB);
        if (nameCmp !== 0) return nameCmp;
        if (srA !== srB) return srA - srB;
        if (rA === rB) return 0;
        return rA < rB ? -1 : 1;
      }

      if (sortBy === "status") {
        if (srA !== srB) return srA - srB;
        const nameCmp = nameA.localeCompare(nameB);
        if (nameCmp !== 0) return nameCmp;
        if (rA === rB) return 0;
        return rA < rB ? -1 : 1;
      }

      // sortBy === 'renewal'
      if (rA !== rB) return rA < rB ? -1 : 1;
      const nameCmp = nameA.localeCompare(nameB);
      if (nameCmp !== 0) return nameCmp;
      return srA - srB;
    });
    return arr;
  }, [groupedSubscriptions, sortBy]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedProducts;
    }
    const searchLower = searchTerm.toLowerCase();
    return groupedProducts.filter((group) =>
      group.baseName.toLowerCase().includes(searchLower)
    );
  }, [groupedProducts, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const endIndex = startIndex + PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, PRODUCTS_PER_PAGE]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Check if selected product has quantity restriction and if it's exceeded
  const selectedProductData = useMemo(
    () => allProducts.find((p) => p.product.id === selectedProduct),
    [allProducts, selectedProduct]
  );

  const isQuantityExceeded = useMemo(() => {
    if (!selectedProductData) return false;

    // Check if product has maximum-quantity attribute
    const maxQuantityStr =
      selectedProductData.product.attributes?.["maximum-quantity"];
    if (!maxQuantityStr) return false;

    const maxQuantity = parseInt(maxQuantityStr, 10);
    if (isNaN(maxQuantity)) return false;

    return quantity > maxQuantity;
  }, [selectedProductData, quantity]);

  // Get the maximum quantity for error message
  const maxAllowedQuantity = useMemo(() => {
    if (!selectedProductData) return null;
    const maxQuantityStr =
      selectedProductData.product.attributes?.["maximum-quantity"];
    if (!maxQuantityStr) return null;
    const maxQuantity = parseInt(maxQuantityStr, 10);
    return isNaN(maxQuantity) ? null : maxQuantity;
  }, [selectedProductData]);

  const minAllowedQuantity = useMemo(() => {
    if (!selectedProductData) return null;
    const minQuantityStr =
      selectedProductData.product.attributes?.["minimum-quantity"];
    if (!minQuantityStr) return null;
    const minQuantity = parseInt(minQuantityStr, 10);
    return isNaN(minQuantity) ? null : minQuantity;
  }, [selectedProductData]);

  // Track previous exceeded state to avoid duplicate toasts
  const prevExceededRef = useRef(false);

  // Component mount logging
  useEffect(() => {
    log.info("CustomerDetail component mounted", { customerId });
    return () => {
      log.debug("CustomerDetail component unmounted", { customerId });
    };
  }, [customerId]);

  // Log data fetch errors
  useEffect(() => {
    if (error) {
      log.error("Failed to load customer data", error as Error, { customerId });
    }
  }, [error, customerId]);

  useEffect(() => {
    if (subscriptionsError) {
      log.error("Failed to load subscriptions", subscriptionsError as Error, {
        customerId,
      });
    }
  }, [subscriptionsError, customerId]);

  // Show toast when quantity exceeds limit for restricted SKU
  useEffect(() => {
    // Only show toast when transitioning from not exceeded to exceeded
    if (isQuantityExceeded && !prevExceededRef.current && maxAllowedQuantity) {
      log.warn("Quantity exceeds maximum limit", {
        customerId,
        productId: selectedProduct,
        quantity,
        maxAllowedQuantity,
      });
      showToast(
        `Dette produkt har en maksimal grænse på ${maxAllowedQuantity} licenser`,
        "error",
        5000
      );
    }
    prevExceededRef.current = isQuantityExceeded;
  }, [
    isQuantityExceeded,
    showToast,
    maxAllowedQuantity,
    customerId,
    selectedProduct,
    quantity,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-600 dark:text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Indlæser kundedata...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fejl ved indlæsning</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error
                ? error.message
                : "Kunne ikke indlæse kundedata"}
            </p>
            <Button onClick={() => navigate("/customers")} className="w-full">
              Tilbage til kunder
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/customers")}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Tilbage til kunder
          </Button>
        </div>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 p-6 md:p-8 mb-10">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/10 backdrop-blur border border-white/60 dark:border-white/10 shadow-sm">
                <Building2 className="w-8 h-8 text-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {customer.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {customer.customerReference && (
                    <Badge variant="outline" className="bg-background">
                      {getCustomerReferenceName(customer.customerReference)}
                    </Badge>
                  )}
                  {customer.email && (
                    <Badge variant="secondary" className="gap-2">
                      <Mail className="w-3.5 h-3.5" /> {customer.email}
                    </Badge>
                  )}
                  {customer.phone && (
                    <Badge variant="secondary" className="gap-2">
                      <Phone className="w-3.5 h-3.5" /> {customer.phone}
                    </Badge>
                  )}
                </div>
                {/* Quick stat chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="gap-2 bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/20 hover:bg-blue-600/20">
                    <Package className="w-3.5 h-3.5" />{" "}
                    {subscriptionStats.total} abonnementer
                  </Badge>
                  <Badge className="gap-2 bg-green-600/10 text-green-700 dark:text-green-300 border-green-600/20 hover:bg-green-600/20">
                    <CheckCircle className="w-3.5 h-3.5" />{" "}
                    {subscriptionStats.active} aktive
                  </Badge>
                  <Badge className="gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20">
                    <Clock className="w-3.5 h-3.5" /> {subscriptionStats.trial}{" "}
                    prøve
                  </Badge>
                  <Badge className="gap-2 bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-600/20 hover:bg-purple-600/20">
                    <TrendingUp className="w-3.5 h-3.5" />{" "}
                    {subscriptionStats.totalQuantity} licenser
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-2">
            <div className="hidden" />
            {/* Provision modal */}
            <ProvisionModal
              isOpen={showProvisionModal}
              onClose={resetModalState}
              paginatedProducts={paginatedProducts}
              filteredProducts={filteredProducts}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
              selectedVariants={selectedVariants}
              setSelectedVariants={setSelectedVariants}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              quantity={quantity}
              setQuantity={setQuantity}
              minAllowedQuantity={minAllowedQuantity}
              maxAllowedQuantity={maxAllowedQuantity}
              isQuantityExceeded={isQuantityExceeded}
              provisionMutation={provisionMutation}
              onProvision={handleProvisionClick}
              productsPerPage={PRODUCTS_PER_PAGE}
            />

            {/* Unassigned licenses warning dialog */}
            {selectedProduct &&
              (() => {
                const licenseInfo = checkExistingLicenses();
                return licenseInfo ? (
                  <UnassignedLicensesDialog
                    isOpen={showUnassignedWarning}
                    onClose={() => setShowUnassignedWarning(false)}
                    onConfirm={handleConfirmProvision}
                    productName={
                      allProducts.find((p) => p.product.id === selectedProduct)
                        ?.product.name || "Ukendt produkt"
                    }
                    totalLicenses={licenseInfo.total}
                    consumedLicenses={licenseInfo.consumed}
                    newQuantity={quantity}
                  />
                ) : null;
              })()}
            <div className="hidden" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Abonnementer
              </CardTitle>
              <div className="p-2 rounded-md bg-blue-600/10">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subscriptionStats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Samlet antal produkter
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive</CardTitle>
              <div className="p-2 rounded-md bg-green-600/10">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subscriptionStats.active}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aktive licenser
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Prøveperiode
              </CardTitle>
              <div className="p-2 rounded-md bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subscriptionStats.trial}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Test abonnementer
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Licenser
              </CardTitle>
              <div className="p-2 rounded-md bg-purple-600/10">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {subscriptionStats.totalQuantity}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Samlet antal enheder
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  Kontaktinformation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.email && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                      <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-slate-900 dark:text-slate-100 break-words">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  )}

                  {customer.phone && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                      <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Telefon
                        </p>
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          {customer.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
                      <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Adresse
                        </p>
                        <div className="text-sm text-slate-900 dark:text-slate-100">
                          {customer.address.streetName && (
                            <div>{customer.address.streetName}</div>
                          )}
                          {customer.address.streetName2 && (
                            <div>{customer.address.streetName2}</div>
                          )}
                          <div>
                            {customer.address.postalCode}{" "}
                            {customer.address.city}
                          </div>
                          {customer.address.countryCode && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {customer.address.countryCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Firma Information
                  </h3>
                  <div className="space-y-3">
                    {microsoftCustomer?.[0]?.companyProfile?.domain && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          {microsoftCustomer?.[0]?.companyProfile?.domain}
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {customer.vatId}
                        </span>
                      </div>
                    )}
                    {customer.displayCurrency && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Valuta
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                          {customer.displayCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-slate-200 dark:border-gray-700">
              <Tabs defaultValue="microsoft" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="microsoft" className="gap-2">
                    <Package className="w-4 h-4" />
                    Microsoft Abonnementer
                  </TabsTrigger>
                  <TabsTrigger value="keepit" className="gap-2">
                    <Server className="w-4 h-4" />
                    KeepIt Enheder
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="microsoft" className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                      Microsoft Abonnementer
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="sub-sort"
                          className="text-sm text-slate-600 dark:text-slate-300"
                        >
                          Sortér
                        </label>
                        <select
                          id="sub-sort"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortKey)}
                          className="text-sm rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 px-2 py-1"
                        >
                          <option value="name">Navn</option>
                          <option value="status">Status</option>
                          <option value="renewal">Næste fornyelse</option>
                        </select>
                      </div>
                      <Button
                        onClick={() => setShowProvisionModal(true)}
                        disabled={!isAdmin}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Package className="w-4 h-4" /> Provisioner
                      </Button>
                    </div>
                  </div>

                  {subscriptionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-slate-600 dark:text-slate-400 animate-spin" />
                    </div>
                  ) : subscriptionsError ? (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">
                          {subscriptionsError instanceof Error
                            ? subscriptionsError.message
                            : "Kunne ikke indlæse abonnementer"}
                        </p>
                      </div>
                    </div>
                  ) : sortedGroupedSubscriptions.length > 0 ? (
                    <div className="space-y-4">
                      {sortedGroupedSubscriptions.map((group) => (
                        <SubscriptionCard
                          key={group.key}
                          group={group}
                          isExpanded={!!expandedGroups[group.key]}
                          onToggleExpand={toggleGroup}
                          resolveProductForSubscription={
                            resolveProductForSubscription
                          }
                          displayCurrency={customer!.displayCurrency || "DKK"}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-12 text-center">
                      <Package className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
                        Ingen abonnementer fundet
                      </p>
                      <p className="text-slate-500 dark:text-slate-500 text-sm">
                        Denne kunde har ingen aktive Microsoft abonnementer
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="keepit">
                  <KeepItDevicesList
                    devices={keepItDevices || []}
                    isLoading={keepItLoading}
                    error={keepItError}
                    customerGuid={customerId || ""}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
