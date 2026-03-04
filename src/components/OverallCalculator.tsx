import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  Trash2,
  Calculator,
  Calendar,
  X,
  Download,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatCurrency } from "../utils/currency";
import { exportToExcel } from "../utils/excelExport";
import { logger } from "../utils/logger";
import { getMaxQuantity } from "../utils/incentiveHelpers";
import TotalsCard from "./calculator/TotalsCard";
import { Button } from "./ui/button";

export default function OverallCalculator() {
  const log = logger.createScopedLogger("OverallCalculator");
  const navigate = useNavigate();

  const {
    cartItems,
    updateQuantity,
    updateDiscount,
    removeFromCart,
    clearCart,
  } = useCart();

  // Component mount logging
  useEffect(() => {
    document.title = "Produkt beregner - Cloud Factory Presales Portal";
    log.info("OverallCalculator component mounted", {
      itemCount: cartItems.length,
    });
    return () => {
      log.debug("OverallCalculator component unmounted");
    };
  }, []);
  // local input state for quantities (string to allow empty input while typing)
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>(
    {},
  );
  // validation errors per item id
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>(
    {},
  );
  const [showMonthly, setShowMonthly] = useState(false);
  const { showToast } = useToast();

  const calculateTotals = () => {
    let yearlyCost = 0;
    let yearlySale = 0;

    cartItems.forEach((item) => {
      const baseCost = item.productResult.price.cost;
      const baseSalePrice = item.productResult.price.sale;
      const finalSalePrice = baseSalePrice * (1 - item.discount / 100);
      const recursionTerm = item.productResult.product.recursionTerm;
      const itemSalePerTerm = finalSalePrice * item.quantity;
      const itemCost = baseCost * item.quantity;

      if (recursionTerm >= 12) {
        yearlyCost += itemCost;
        yearlySale += itemSalePerTerm;
      } else if (recursionTerm > 0) {
        const occurrencesPerYear = 12 / recursionTerm;
        yearlyCost += itemCost * occurrencesPerYear;
        yearlySale += itemSalePerTerm * occurrencesPerYear;
      } else {
        yearlyCost += itemCost;
        yearlySale += itemSalePerTerm;
      }
    });

    return { yearlyCost, yearlySale };
  };

  const { yearlyCost, yearlySale } = calculateTotals();

  const yearlyProfit = yearlySale - yearlyCost;
  const profitMargin = yearlySale > 0 ? (yearlyProfit / yearlySale) * 100 : 0;
  const monthlyCost = yearlyCost / 12;
  const monthlySale = yearlySale / 12;
  const monthlyProfit = yearlyProfit / 12;

  const currency =
    cartItems.length > 0 ? cartItems[0].productResult.price.currency : "DKK";

  // initialize local inputs from cartItems and keep in sync when cart changes
  // but avoid overwriting any input that is currently focused/being edited
  useEffect(() => {
    const map = { ...quantityInputs };
    cartItems.forEach((it) => {
      const id = it.productResult.product.id;
      const inputEl = document.getElementById(
        `quantity-input-${id}`,
      ) as HTMLInputElement | null;
      // if the input is focused, don't overwrite (user is editing)
      if (inputEl && document.activeElement === inputEl) return;
      map[id] = String(it.quantity);
    });
    setQuantityInputs(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      {/* Hero Header */}
      {cartItems.length > 0 && (
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Calculator className="w-4 h-4" />
                {cartItems.length}{" "}
                {cartItems.length === 1 ? "vare i kurv" : "varer i kurv"}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
                Produkt beregner
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-6">
                Se kost-, salgspris og fortjeneste
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <Button
                  onClick={() => {
                    log.userAction("Export to Excel", {
                      itemCount: cartItems.length,
                      currency,
                      showMonthly,
                    });
                    exportToExcel({
                      cartItems,
                      currency,
                      showMonthly,
                    });
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">
                    <span className="hidden sm:inline">Eksporter til </span>
                    Excel
                  </span>
                </Button>
                <Button
                  onClick={() => {
                    log.userAction("Clear cart", {
                      itemCount: cartItems.length,
                    });
                    clearCart();
                  }}
                  variant="destructive"
                  size="lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">
                    <span className="hidden sm:inline">Tøm </span>Kurv
                  </span>
                </Button>
                <Button
                  onClick={() => setShowMonthly(!showMonthly)}
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-white/20"
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium">
                    {showMonthly ? "Årlig" : "Månedlig"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            {cartItems.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-16 text-center border-2 border-slate-200 dark:border-gray-700">
                <div className="inline-flex p-6 bg-slate-100 dark:bg-gray-700 rounded-full mb-6">
                  <Calculator className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Ingen produkter tilføjet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
                  Tilføj produkter fra kataloget for at se overordnede
                  beregninger
                </p>
                <button
                  onClick={() => navigate("/products")}
                  className="inline-flex items-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white py-3 px-5 rounded-lg transition-colors"
                >
                  Gå til produkter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const baseCost = item.productResult.price.cost;
                  const baseSalePrice = item.productResult.price.sale;
                  const finalSalePrice =
                    baseSalePrice * (1 - item.discount / 100);
                  const itemTotalSale = finalSalePrice * item.quantity;
                  // Per-item yearly sale
                  const recursionTerm =
                    item.productResult.product.recursionTerm;
                  const itemYearlySale =
                    recursionTerm >= 12
                      ? itemTotalSale
                      : recursionTerm > 0
                        ? itemTotalSale * (12 / recursionTerm)
                        : itemTotalSale;
                  const itemMonthlySale = itemYearlySale / 12;
                  return (
                    <div
                      key={item.productResult.product.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-slate-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-colors shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                            {item.productResult.product.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            SKU: {item.productResult.product.sku}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Commitment:{" "}
                            {item.productResult.product.recursionTerm} måneder -
                            Billing: {item.productResult.product.billingTerm}{" "}
                            måneder
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            log.userAction("Remove from cart", {
                              productId: item.productResult.product.id,
                              productName: item.productResult.product.name,
                            });
                            removeFromCart(item.productResult.product.id);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Kostpris pr. bruger
                          </p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(baseCost, currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            {item.productResult.product.categoryId ===
                            "db584fbc-8a3a-4c68-b486-d9c8764dc10e"
                              ? "MSRP pris pr. bruger"
                              : "Vejl. pris pr. bruger"}
                          </p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(finalSalePrice, currency)}
                          </p>
                          {item.discount > 0 && (
                            <p className="text-xs text-red-600">
                              -{item.discount}% rabat
                            </p>
                          )}
                        </div>
                        {item.productResult.product.recursionTerm !== 1 ||
                        item.productResult.product.billingTerm !== 1 ? (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Månedlig kostpris pr. bruger
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(baseCost / 12, currency)}
                            </p>
                          </div>
                        ) : null}
                        {item.productResult.product.recursionTerm !== 1 ||
                        item.productResult.product.billingTerm !== 1 ? (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              Månedlig ydelse pr. bruger
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {formatCurrency(finalSalePrice / 12, currency)}
                            </p>
                          </div>
                        ) : null}

                        {item.productResult.product.recursionTerm !== 1 ||
                        item.productResult.product.billingTerm !== 1 ? (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                              {item.quantity > 1
                                ? "Total pris pr. bruger/måned"
                                : null}
                            </p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                              {item.quantity > 1
                                ? formatCurrency(
                                    (finalSalePrice * item.quantity) / 12,
                                    currency,
                                  )
                                : null}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => {
                              const id = item.productResult.product.id;
                              const newQty = item.quantity - 1;
                              updateQuantity(id, newQty);
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [id]: String(Math.max(1, newQty)),
                              }));
                              setQuantityErrors((prev) => ({
                                ...prev,
                                [id]: "",
                              }));
                            }}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                          </button>
                          <input
                            id={`quantity-input-${item.productResult.product.id}`}
                            aria-label={`Quantity for ${item.productResult.product.name}`}
                            type="number"
                            min={1}
                            value={
                              quantityInputs[item.productResult.product.id] ??
                              String(item.quantity)
                            }
                            onChange={(e) => {
                              const id = item.productResult.product.id;
                              const newVal = e.target.value;
                              // allow empty while typing
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [id]: newVal,
                              }));
                              // clear validation error while typing
                              setQuantityErrors((prev) => ({
                                ...prev,
                                [id]: "",
                              }));
                            }}
                            onBlur={(e) => {
                              const id = item.productResult.product.id;
                              const raw = (
                                e.target as HTMLInputElement
                              ).value.trim();
                              if (raw === "") {
                                // revert to current cart quantity if left empty
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(item.quantity),
                                }));
                                setQuantityErrors((prev) => ({
                                  ...prev,
                                  [id]: "",
                                }));
                                return;
                              }
                              const parsed = parseInt(raw, 10);
                              if (isNaN(parsed) || parsed < 1) {
                                setQuantityErrors((prev) => ({
                                  ...prev,
                                  [id]: "Indtast et heltal >= 1",
                                }));
                                showToast(
                                  "Indtast et heltal >= 1",
                                  "error",
                                  3500,
                                );
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(item.quantity),
                                }));
                                return;
                              }
                              // Check maximum quantity from product attributes
                              const maxQuantity = getMaxQuantity(
                                item.productResult,
                              );
                              if (
                                maxQuantity !== null &&
                                parsed > maxQuantity
                              ) {
                                const msg = `Maksimum ${maxQuantity} tilladt for dette produkt`;
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(item.quantity),
                                }));
                                showToast(msg, "info", 3500);
                                return;
                              }
                              // commit valid value
                              updateQuantity(id, parsed);
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [id]: String(parsed),
                              }));
                              setQuantityErrors((prev) => ({
                                ...prev,
                                [id]: "",
                              }));
                            }}
                            onKeyDown={(e) => {
                              const id = item.productResult.product.id;
                              if (e.key === "Enter") {
                                const raw = (
                                  e.target as HTMLInputElement
                                ).value.trim();
                                if (raw === "") {
                                  setQuantityInputs((prev) => ({
                                    ...prev,
                                    [id]: String(item.quantity),
                                  }));
                                  setQuantityErrors((prev) => ({
                                    ...prev,
                                    [id]: "",
                                  }));
                                  (e.target as HTMLInputElement).blur();
                                  return;
                                }
                                const parsed = parseInt(raw, 10);
                                if (isNaN(parsed) || parsed < 1) {
                                  setQuantityErrors((prev) => ({
                                    ...prev,
                                    [id]: "Indtast et heltal >= 1",
                                  }));
                                  return;
                                }
                                // Check maximum quantity from product attributes
                                const maxQuantity = getMaxQuantity(
                                  item.productResult,
                                );
                                if (
                                  maxQuantity !== null &&
                                  parsed > maxQuantity
                                ) {
                                  showToast(
                                    `Maksimum ${maxQuantity} tilladt for dette produkt`,
                                    "info",
                                  );
                                  return;
                                }
                                updateQuantity(id, parsed);
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(parsed),
                                }));
                                setQuantityErrors((prev) => ({
                                  ...prev,
                                  [id]: "",
                                }));
                                (e.target as HTMLInputElement).blur();
                              } else if (e.key === "Escape") {
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(item.quantity),
                                }));
                                setQuantityErrors((prev) => ({
                                  ...prev,
                                  [id]: "",
                                }));
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-20 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 text-lg font-semibold hover:border-slate-500 dark:hover:border-gray-400 dark:text-slate-200 bg-white dark:bg-gray-700 text-slate-900 transition-all"
                          />
                          {quantityErrors[item.productResult.product.id] && (
                            <p className="text-xs text-red-600 mt-1">
                              {quantityErrors[item.productResult.product.id]}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              const id = item.productResult.product.id;
                              const newQty = item.quantity + 1;
                              // Check maximum quantity from product attributes
                              const maxQuantity = getMaxQuantity(
                                item.productResult,
                              );
                              if (
                                maxQuantity !== null &&
                                newQty > maxQuantity
                              ) {
                                const msg = `Maksimum ${maxQuantity} tilladt for dette produkt`;
                                showToast(msg, "info", 3500);
                                // keep displayed value at current quantity
                                setQuantityInputs((prev) => ({
                                  ...prev,
                                  [id]: String(item.quantity),
                                }));
                                return;
                              }
                              updateQuantity(id, newQty);
                              setQuantityInputs((prev) => ({
                                ...prev,
                                [id]: String(newQty),
                              }));
                              setQuantityErrors((prev) => ({
                                ...prev,
                                [id]: "",
                              }));
                            }}
                            className="bg-slate-200 hover:bg-slate-300 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                          </button>
                        </div>
                        <div>
                          <label
                            htmlFor={`discount-${item.productResult.product.id}`}
                            className="text-xs text-slate-500 dark:text-slate-400 mb-1 block"
                          >
                            Rabat (%)
                          </label>
                          <input
                            id={`discount-${item.productResult.product.id}`}
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              updateDiscount(
                                item.productResult.product.id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 text-sm hover:border-slate-500 dark:hover:border-gray-400 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {showMonthly ? "Total pr. måned" : "Total pr. år"}
                          </p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(
                              showMonthly ? itemMonthlySale : itemYearlySale,
                              currency,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <TotalsCard
              showMonthly={showMonthly}
              yearlyCost={yearlyCost}
              monthlyCost={monthlyCost}
              yearlySale={yearlySale}
              monthlySale={monthlySale}
              yearlyProfit={yearlyProfit}
              monthlyProfit={monthlyProfit}
              profitMargin={profitMargin}
              currency={currency}
            />
          )}
        </div>
      </div>
    </div>
  );
}
