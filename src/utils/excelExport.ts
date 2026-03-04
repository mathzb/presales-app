import * as XLSX from "xlsx";
import { CartItem } from "../types/product";

interface ExportData {
  cartItems: CartItem[];
  currency: string; // e.g., DKK
  showMonthly: boolean; // true = export per-month prices, false = per-year
}

// Excel number format for currency (DK locale-friendly)
const CURRENCY_FMT = "#,##0.00";

// Normalize numbers (prevent NaN/undefined)
const num = (v: number | undefined | null, fallback = 0): number =>
  typeof v === "number" && !isNaN(v) ? v : fallback;

// Convert a per-term unit amount to per-billing (monthly/yearly) consistently
const toPerBilling = (
  unitPerTerm: number,
  commitmentMonths: number | undefined,
  wantMonthly: boolean,
): number => {
  const months = Math.max(1, num(commitmentMonths, 1));
  if (wantMonthly) {
    // Spread total term price across months
    return unitPerTerm / months;
  }
  // Per year: normalize by years in term
  const years = Math.max(1, months / 12);
  return unitPerTerm / years;
};

export function exportToExcel(data: ExportData) {
  const { cartItems, currency, showMonthly } = data;

  // Build rows using a fast AOA (array-of-arrays) for predictable order and speed
  const header = [
    "Product Name",
    "Quantity",
    showMonthly ? "Unit Price (Monthly)" : "Unit Price (Yearly)",
    "Discount (%)",
    "Final Unit Price",
    "Total Final Price",
    "Cost Unit",
    "Total Cost",
    "Commitment (months)",
    "Billing Cycle (months)",
    "Currency",
  ];

  const rows: (string | number)[][] = [header];

  for (const item of cartItems) {
    const p = item.productResult;
    const baseSale = num(p.price?.sale);
    const baseCost = num(p.price?.cost);
    const commitmentMonths = num(p.product.recursionTerm, 1);
    const billingMonths = num(p.product.billingTerm, 1);

    // Per-billing unit amounts (derived from total term amounts)
    const unitSalePerBilling = toPerBilling(
      baseSale,
      commitmentMonths,
      showMonthly,
    );
    const unitCostPerBilling = toPerBilling(
      baseCost,
      commitmentMonths,
      showMonthly,
    );

    // Apply item discount
    const afterItemDiscount =
      unitSalePerBilling * (1 - num(item.discount) / 100);
    const finalUnit = afterItemDiscount;

    const totalFinal = finalUnit * num(item.quantity, 0);
    const totalCost = unitCostPerBilling * num(item.quantity, 0);

    rows.push([
      p.product.name,
      num(item.quantity, 0),
      Number(unitSalePerBilling.toFixed(2)),
      num(item.discount, 0),
      Number(afterItemDiscount.toFixed(2)),
      Number(totalFinal.toFixed(2)),
      Number(unitCostPerBilling.toFixed(2)),
      Number(totalCost.toFixed(2)),
      commitmentMonths,
      billingMonths,
      currency,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths (match header order)
  ws["!cols"] = [
    { wch: 40 }, // Product Name
    { wch: 10 }, // Quantity
    { wch: 18 }, // Unit Price (Monthly/Yearly)
    { wch: 14 }, // Discount (%)
    { wch: 18 }, // Final Unit Price
    { wch: 18 }, // Total Final Price
    { wch: 14 }, // Cost Unit
    { wch: 14 }, // Total Cost
    { wch: 20 }, // Commitment (months)
    { wch: 22 }, // Billing Cycle (months)
    { wch: 10 }, // Currency
  ];

  // Freeze header row and add autofilter (cast safely to avoid 'any')
  const wsExt = ws as unknown as Record<string, unknown>;
  wsExt["!freeze"] = { xSplit: 0, ySplit: 1 };
  wsExt["!autofilter"] = {
    ref: XLSX.utils.encode_range(XLSX.utils.decode_range(ws["!ref"] as string)),
  };

  // Apply number formats for currency and numeric columns (skip header at row 1)
  const range = XLSX.utils.decode_range(ws["!ref"] as string);
  for (let R = range.s.r + 1; R <= range.e.r; R++) {
    // Columns: 2 (unit price), 4 (final unit), 5 (total final), 6 (cost unit), 7 (total cost)
    for (const C of [2, 4, 5, 6, 7]) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (cell && typeof cell.v === "number") {
        cell.z = CURRENCY_FMT;
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");

  const now = new Date();
  const yyyy_mm_dd = now.toISOString().split("T")[0];
  const hhmm = `${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  const fileName = `price-calculator-export-${yyyy_mm_dd}-${hhmm}.xlsx`;

  // Enable compression for smaller files
  XLSX.writeFile(wb, fileName, { compression: true });
}
