import { Search, Package, Loader2, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import {
  monthsFromCommitmentLabel,
  perBillingFromUnit,
} from "../../utils/productHelpers";
import type { GroupedProduct } from "../../utils/productGrouping";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paginatedProducts: GroupedProduct[];
  filteredProducts: GroupedProduct[];
  selectedProduct: string | undefined;
  setSelectedProduct: (productId: string) => void;
  selectedVariants: Map<string, number>;
  setSelectedVariants: (variants: Map<string, number>) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  quantity: number;
  setQuantity: (quantity: number) => void;
  minAllowedQuantity: number | null;
  maxAllowedQuantity: number | null;
  isQuantityExceeded: boolean;
  provisionMutation: {
    isPending: boolean;
  };
  onProvision: () => void;
  productsPerPage: number;
}

export default function ProvisionModal({
  isOpen,
  onClose,
  paginatedProducts,
  filteredProducts,
  selectedProduct,
  setSelectedProduct,
  selectedVariants,
  setSelectedVariants,
  searchTerm,
  setSearchTerm,
  currentPage,
  setCurrentPage,
  totalPages,
  quantity,
  setQuantity,
  minAllowedQuantity,
  maxAllowedQuantity,
  isQuantityExceeded,
  provisionMutation,
  onProvision,
  productsPerPage,
}: ProvisionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Provisionere Microsoft licens(er)</DialogTitle>
          <DialogDescription>
            Søg og vælg produkt, angiv antal og provisionér.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Søg produkter (f.eks. 'Microsoft 365 Business Premium')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto mb-4 border border-slate-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900/60">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>
                {searchTerm
                  ? `Ingen produkter fundet med "${searchTerm}"`
                  : "Ingen produkter tilgængelige"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4">
              {paginatedProducts.map((group: GroupedProduct) => {
                const variantIndex = selectedVariants.get(group.baseName) ?? 0;
                const selectedVariant = group.variants[variantIndex];
                const productResult = selectedVariant.productResult;
                const isSelected = selectedProduct === productResult.product.id;

                return (
                  <Card
                    key={group.baseName}
                    onClick={() => setSelectedProduct(productResult.product.id)}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className="p-2 bg-slate-100 dark:bg-gray-800 rounded-lg flex-shrink-0">
                        <Package className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
                          {group.baseName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          SKU: {productResult.product.sku}
                        </p>

                        {/* Price (per billing cycle based on variant) */}
                        {productResult?.price &&
                          (() => {
                            const unit =
                              typeof productResult.price.sale === "number"
                                ? (productResult.price.sale as number)
                                : (productResult.price.cost as
                                    | number
                                    | undefined);
                            if (typeof unit !== "number" || isNaN(unit))
                              return null;
                            const months = monthsFromCommitmentLabel(
                              selectedVariant.commitment
                            );
                            const perBilling = perBillingFromUnit(
                              unit,
                              selectedVariant.billingCycle,
                              months
                            );
                            const label = formatCurrency(
                              perBilling,
                              productResult.price.currency || "DKK"
                            );
                            const cycleLabel =
                              selectedVariant.billingCycle === "Monthly"
                                ? "/ måned"
                                : "/ år";
                            return (
                              <Badge variant="secondary" className="mb-2">
                                Pris: {label} {cycleLabel}
                              </Badge>
                            );
                          })()}

                        {/* Variant selectors */}
                        {group.variants.length > 1 && (
                          <div className="space-y-1.5">
                            <div>
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 mb-1">
                                Binding
                              </span>
                              <select
                                value={selectedVariant.commitment}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newCommitment = e.target.value;
                                  const newVariants = new Map(selectedVariants);

                                  let newIndex = group.variants.findIndex(
                                    (v: {
                                      commitment: string;
                                      billingCycle: string;
                                    }) =>
                                      v.commitment === newCommitment &&
                                      v.billingCycle ===
                                        selectedVariant.billingCycle
                                  );

                                  if (newIndex === -1) {
                                    newIndex = group.variants.findIndex(
                                      (v: { commitment: string }) =>
                                        v.commitment === newCommitment
                                    );
                                  }

                                  newVariants.set(group.baseName, newIndex);
                                  setSelectedVariants(newVariants);
                                  setSelectedProduct(
                                    group.variants[newIndex].productResult
                                      .product.id
                                  );
                                }}
                                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                              >
                                {Array.from(
                                  new Set(
                                    group.variants.map(
                                      (v: { commitment: string }) =>
                                        v.commitment
                                    )
                                  )
                                ).map((commitment: string) => (
                                  <option key={commitment} value={commitment}>
                                    {commitment}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 mb-1">
                                Faktureringscyklus
                              </span>
                              <select
                                value={selectedVariant.billingCycle}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  const newBillingCycle = e.target.value;
                                  const newVariants = new Map(selectedVariants);

                                  let newIndex = group.variants.findIndex(
                                    (v: {
                                      commitment: string;
                                      billingCycle: string;
                                    }) =>
                                      v.billingCycle === newBillingCycle &&
                                      v.commitment ===
                                        selectedVariant.commitment
                                  );

                                  if (newIndex === -1) {
                                    newIndex = group.variants.findIndex(
                                      (v: { billingCycle: string }) =>
                                        v.billingCycle === newBillingCycle
                                    );
                                  }

                                  newVariants.set(group.baseName, newIndex);
                                  setSelectedVariants(newVariants);
                                  setSelectedProduct(
                                    group.variants[newIndex].productResult
                                      .product.id
                                  );
                                }}
                                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                              >
                                {Array.from(
                                  new Set(
                                    group.variants.map(
                                      (v: { billingCycle: string }) =>
                                        v.billingCycle
                                    )
                                  )
                                ).map((billingCycle: string) => (
                                  <option
                                    key={billingCycle}
                                    value={billingCycle}
                                  >
                                    {billingCycle}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {filteredProducts.length > productsPerPage && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-gray-700">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Viser {(currentPage - 1) * productsPerPage + 1} til{" "}
              {Math.min(currentPage * productsPerPage, filteredProducts.length)}{" "}
              af {filteredProducts.length} produkter
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Forrige
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first page, last page, current page, and pages around current
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    // Add ellipsis if there's a gap
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Næste
              </Button>
            </div>
          </div>
        )}

        {/* Quantity input */}
        <div className="mb-4 space-y-2">
          <label className="text-sm font-medium">Antal licenser</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <div className="flex flex-wrap gap-2">
            {minAllowedQuantity && (
              <Badge variant="default">
                <AlertCircle className="w-3 h-3 mr-1" />
                Minimum: {minAllowedQuantity} licens(er)
              </Badge>
            )}
            {maxAllowedQuantity && (
              <Badge variant="default">
                <AlertCircle className="w-3 h-3 mr-1" />
                Maksimum: {maxAllowedQuantity} licens(er)
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuller
          </Button>
          <Button
            onClick={onProvision}
            disabled={
              !selectedProduct ||
              provisionMutation.isPending ||
              isQuantityExceeded
            }
          >
            {provisionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Provisionerer...
              </>
            ) : (
              "Provisioner"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
