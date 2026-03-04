import { useState, useMemo, useEffect, useRef } from "react";
import {
  Package,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";
import { useProducts } from "../hooks/useProducts";
import {
  groupProductsByVariants,
  GroupedProduct,
} from "../utils/productGrouping";
import Alert from "./Alert";
import { logger } from "../utils/logger";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProductList() {
  const log = logger.createScopedLogger("ProductList");

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedVariants, setSelectedVariants] = useState<Map<string, number>>(
    new Map()
  );
  const [descriptionModal, setDescriptionModal] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const { addToCart } = useCart();
  const { data, isLoading, error, refetch } = useProducts(250);

  const { data: microsoftLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/microsoft_logo.png");

  const { data: acronisLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/acronis_logo.png");

  const { data: keepitLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/keepit_logo.png");

  const { data: dropboxLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/dropbox_logo.webp");

  const { data: dropboxSignLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/dropboxsign_logo.webp");

  const { data: twingateLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/twingate_logo.png");

  const { data: esetLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/eset_logo.png");

  const { data: exclaimerLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/exclaimer_logo.png");

  const { data: impossibleCloudLogo } = supabase.storage
    .from("cloudfactory-presales-app")
    .getPublicUrl("images/impossible_cloud_logo.png");

  // Component mount logging
  useEffect(() => {
    document.title = "Produktliste - Cloud Factory Presales Portal";
    log.info("ProductList component mounted");
    return () => {
      log.debug("ProductList component unmounted");
    };
  }, []);

  // Log fetch errors
  useEffect(() => {
    if (error) {
      log.error("Failed to load products", error as Error);
    }
  }, [error]);

  // Close modal on Escape key
  useEffect(() => {
    if (!descriptionModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDescriptionModal(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [descriptionModal]);

  const allProducts = data?.results || [];
  const groupedProducts = useMemo(
    () => groupProductsByVariants(allProducts),
    [allProducts]
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return groupedProducts;
    }
    const searchLower = searchTerm.toLowerCase();
    return groupedProducts.filter((group) =>
      group.baseName.toLowerCase().includes(searchLower)
    );
  }, [groupedProducts, searchTerm]);

  const totalRecords = filteredProducts.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedProducts = useMemo(() => {
    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, pageIndex, pageSize]);

  const metadata = {
    page: pageIndex,
    pageSize,
    totalPages,
    totalRecords,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-600 dark:text-slate-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            Indlæser alle produkter...
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Dette kan tage et øjeblik
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2 text-center">
            Fejl ved indlæsning af produkter
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-4">
            {error instanceof Error
              ? error.message
              : "Kunne ikke indlæse produkter"}
          </p>
          <Button onClick={() => refetch()} className="w-full" size="lg">
            Prøv igen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Badge className="gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 mb-6 hover:bg-white/20 border-white/20">
              <Package className="w-4 h-4" />
              {groupedProducts.length} Produkter Tilgængelige
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Produktkatalog
            </h1>

            <p className="text-sm text-slate-300 mt-3">
              {allProducts.length} totale varianter tilgængelige
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity pointer-events-none" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
              <Input
                type="text"
                placeholder="Søg produkter... (f.eks. 'Microsoft 365 Business Premium')"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageIndex(1);
                }}
                className="w-full pl-14 pr-6 py-4 text-lg shadow-lg hover:shadow-xl"
              />
            </div>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="pageSize"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Vis per side:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(1);
                    }}
                    className="px-4 py-2 border-2 border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 font-medium hover:border-blue-500 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                    {(metadata.page - 1) * metadata.pageSize + 1} -{" "}
                    {Math.min(
                      metadata.page * metadata.pageSize,
                      metadata.totalRecords
                    )}
                  </span>
                  <span>af</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold">
                    {metadata.totalRecords}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {paginatedProducts.length === 0 ? (
          <Card className="shadow-2xl border-2">
            <CardContent className="p-16 text-center">
              <div className="inline-flex p-6 bg-slate-100 dark:bg-gray-700 rounded-full mb-6">
                <Package className="w-16 h-16 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Ingen produkter fundet
              </h3>
              <p className="text-muted-foreground text-lg">
                {searchTerm
                  ? `Prøv at søge efter noget andet end "${searchTerm}"`
                  : "Der er ingen produkter tilgængelige i øjeblikket"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {paginatedProducts.map((group: GroupedProduct) => {
              const variantIndex = selectedVariants.get(group.baseName) ?? 0;
              const selectedVariant = group.variants[variantIndex];
              const productResult = selectedVariant.productResult;
              const price = productResult.price;
              const hasPrice =
                price !== null &&
                price !== undefined &&
                price.cost !== null &&
                price.sale !== null;
              const displayCurrency = price?.currency ?? "DKK";
              const productDescription =
                productResult.product.description ?? "";

              return (
                <Card
                  key={group.baseName}
                  className="overflow-hidden group border-2 hover:border-blue-400 dark:hover:border-blue-600 transform hover:scale-[1.02] transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-100 dark:bg-gray-700 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-gray-600 transition-colors">
                        {productResult.product.categoryId ===
                        "17b25186-f833-4e96-9251-8fc2a1e7ff44" ? (
                          <img
                            src={`${acronisLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                            "db584fbc-8a3a-4c68-b486-d9c8764dc10e" ||
                          productResult.product.categoryId ===
                            "4b568c89-7305-4dcf-8214-690c0c67e9ed" ||
                          productResult.product.categoryId ===
                            "359e9152-c8ab-4fc4-895c-7b1a79fd8a97" ||
                          productResult.product.categoryId ===
                            "1186affd-69d7-43dd-b7cb-c7bbaf4db42e" ? (
                          <img
                            src={`${microsoftLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "1b3e4e55-012c-4be4-8640-25c7a4c05579" ? (
                          <img
                            src={
                              "https://www.platinumtechnology.com.au/wp-content/uploads/2025/08/Mircosoft-Azure-Logo.png"
                            }
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "78aaf55b-588b-47aa-b75b-901ba636b1be" ? (
                          <img
                            src={`${twingateLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "81896148-7d02-40a4-b108-765ade3cba13" ? (
                          <img
                            src={`${dropboxSignLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "a9b34d8e-3fd3-48c4-87ff-a17b6482d482" ? (
                          <img
                            src={`${dropboxLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "67f53f7f-f54a-4536-83ba-4a2f72155b0f" ? (
                          <img
                            src={`${keepitLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "5d6446b2-b171-4877-b44c-cbf731676cb5" ? (
                          <img
                            src={`${esetLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "ba0fdc23-e8ec-47e6-bba7-58866c26ea08" ? (
                          <img
                            src={`${impossibleCloudLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : productResult.product.categoryId ===
                          "05d5a7e3-4b2f-4a63-b860-4e9e41a8a45b" ? (
                          <img
                            src={`${exclaimerLogo.publicUrl}`}
                            alt={productResult.product.name}
                            className="w-full h-auto"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                      {productResult.product.deprecated && (
                        <Badge variant="destructive" className="text-xs">
                          {productResult.product.deprecated}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                      {group.baseName}
                    </h3>

                    {group.variants.length > 1 && (
                      <div className="mb-3 space-y-2">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">
                            Binding
                          </label>
                          <select
                            value={selectedVariant.commitment}
                            onChange={(e) => {
                              const newCommitment = e.target.value;
                              const newVariants = new Map(selectedVariants);

                              let newIndex = group.variants.findIndex(
                                (v) =>
                                  v.commitment === newCommitment &&
                                  v.billingCycle ===
                                    selectedVariant.billingCycle
                              );

                              if (newIndex === -1) {
                                newIndex = group.variants.findIndex(
                                  (v) => v.commitment === newCommitment
                                );
                              }

                              newVariants.set(group.baseName, newIndex);
                              setSelectedVariants(newVariants);
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                          >
                            {Array.from(
                              new Set(group.variants.map((v) => v.commitment))
                            ).map((commitment) => (
                              <option key={commitment} value={commitment}>
                                {commitment}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 block">
                            Faktureringscyklus
                          </label>
                          <select
                            value={selectedVariant.billingCycle}
                            onChange={(e) => {
                              const newBilling = e.target.value;
                              const newVariants = new Map(selectedVariants);

                              let newIndex = group.variants.findIndex(
                                (v) =>
                                  v.commitment === selectedVariant.commitment &&
                                  v.billingCycle === newBilling
                              );

                              if (newIndex === -1) {
                                newIndex = group.variants.findIndex(
                                  (v) => v.billingCycle === newBilling
                                );
                              }

                              newVariants.set(group.baseName, newIndex);
                              setSelectedVariants(newVariants);
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                          >
                            {group.variants
                              .filter(
                                (v) =>
                                  v.commitment === selectedVariant.commitment
                              )
                              .map((v) => v.billingCycle)
                              .filter(
                                (value, index, self) =>
                                  self.indexOf(value) === index
                              )
                              .map((billingCycle) => (
                                <option key={billingCycle} value={billingCycle}>
                                  {billingCycle}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {productResult.product.billingTerm === 0 &&
                    productResult.product.recursionTerm === 1 ? (
                      <div className="mb-2">
                        <Alert type="info">Dette er en prøvelicens.</Alert>
                      </div>
                    ) : null}

                    <ProductDescriptionSnippet
                      title={productResult.product.name}
                      description={productDescription}
                      onOpen={() =>
                        setDescriptionModal({
                          title: productResult.product.name,
                          description: productDescription,
                        })
                      }
                    />

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          SKU:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {productResult.product.sku}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Kostpris:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {hasPrice
                            ? formatCurrency(price!.cost, displayCurrency)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Vejl. Pris:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-semibold">
                          {hasPrice
                            ? formatCurrency(price!.sale, displayCurrency)
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {productResult.product.tags &&
                      productResult.product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {productResult.product.tags
                            .slice(0, 3)
                            .map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                        </div>
                      )}
                  </CardContent>

                  <CardContent className="bg-slate-50 dark:bg-gray-900 px-6 py-4 border-t border-slate-200 dark:border-gray-700">
                    {selectedProductId === productResult.product.id ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-20 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                          placeholder="Antal"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            const qty = parseInt(quantity) || 1;
                            log.userAction("Add to cart", {
                              productId: productResult.product.id,
                              productName: productResult.product.name,
                              quantity: qty,
                            });
                            addToCart({
                              productResult,
                              quantity: qty,
                              discount: 0,
                            });
                            setSelectedProductId(null);
                            setQuantity("1");
                          }}
                          className="flex-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors font-medium text-sm"
                        >
                          Bekræft
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProductId(null);
                            setQuantity("1");
                          }}
                          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-medium"
                        >
                          Annuller
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          hasPrice &&
                          setSelectedProductId(productResult.product.id)
                        }
                        disabled={!hasPrice}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors font-medium text-sm ${
                          hasPrice
                            ? "bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white"
                            : "bg-slate-300 dark:bg-gray-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        }`}
                        aria-disabled={!hasPrice}
                        title={
                          hasPrice
                            ? undefined
                            : "Pris ikke tilgængelig for dette produkt"
                        }
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Tilføj til beregner
                      </button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {metadata.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
              disabled={pageIndex === 1}
              variant="outline"
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Forrige
            </Button>

            <div className="flex items-center gap-2">
              {pageIndex > 3 && (
                <>
                  <Button onClick={() => setPageIndex(1)} variant="outline">
                    1
                  </Button>
                  <span className="text-slate-400 dark:text-slate-600">
                    ...
                  </span>
                </>
              )}

              {[...Array(5)].map((_, i) => {
                const page = pageIndex - 2 + i;
                if (page < 1 || page > metadata.totalPages) return null;
                return (
                  <Button
                    key={page}
                    onClick={() => setPageIndex(page)}
                    variant={page === pageIndex ? "default" : "outline"}
                  >
                    {page}
                  </Button>
                );
              })}

              {pageIndex < metadata.totalPages - 2 && (
                <>
                  <span className="text-slate-400 dark:text-slate-600">
                    ...
                  </span>
                  <Button
                    onClick={() => setPageIndex(metadata.totalPages)}
                    variant="outline"
                  >
                    {metadata.totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={() =>
                setPageIndex(Math.min(metadata.totalPages, pageIndex + 1))
              }
              disabled={pageIndex === metadata.totalPages}
              variant="outline"
              className="gap-1"
            >
              Næste
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      {descriptionModal && (
        <ProductDescriptionModal
          open={true}
          title={descriptionModal.title}
          description={descriptionModal.description}
          onClose={() => setDescriptionModal(null)}
        />
      )}
    </div>
  );
}

// Shows a two-line clamped description and only renders a small "Læs mere" badge
// when the content is actually truncated. Falls back to an informational line
// when no description is available.
function ProductDescriptionSnippet({
  title,
  description,
  onOpen,
}: {
  title: string;
  description: string;
  onOpen: () => void;
}) {
  // Ensure hooks are always called unconditionally
  const trimmed = (description ?? "").trim();
  const descRef = useRef<HTMLDivElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = descRef.current;
    // If no description or no element yet, ensure badge is hidden
    if (!trimmed || !el) {
      setIsTruncated(false);
      return;
    }
    const check = () => {
      const truncated =
        el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
      setIsTruncated(truncated);
    };
    check();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => check());
      ro.observe(el);
    }
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
      if (ro) ro.disconnect();
    };
  }, [trimmed]);

  return (
    <div className="mb-4">
      {trimmed ? (
        <>
          <div
            ref={descRef}
            className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2"
          >
            {trimmed}
          </div>
          {isTruncated && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Læs hele beskrivelsen for ${title}`}
            >
              <span>Læs mere</span>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          Ingen beskrivelse tilgængelig.
        </p>
      )}
    </div>
  );
}

// Modal rendering
// Keep at the end of file if needed elsewhere
export function ProductDescriptionModal({
  open,
  title,
  description,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h3>
              <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                {description && description.trim().length > 0
                  ? description
                  : "Ingen beskrivelse tilgængelig."}
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Luk"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-gray-900 px-6 py-4 rounded-b-2xl flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Luk
          </button>
        </div>
      </div>
    </div>
  );
}
