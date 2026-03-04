/**
 * Product resolution and pricing utility functions
 * Used for matching subscriptions to products and calculating prices
 */

/**
 * Parse months from ISO8601 term duration (e.g., P1M, P12M, P1Y)
 */
export const monthsFromTermDuration = (term?: string | null): number | null => {
  if (!term) return null;
  if (term === "P1M") return 1;
  if (term === "P1Y") return 12;
  const mMatch = term.match(/^P(\d+)M$/);
  if (mMatch) return parseInt(mMatch[1], 10);
  const yMatch = term.match(/^P(\d+)Y$/);
  if (yMatch) return parseInt(yMatch[1], 10) * 12;
  return null;
};

/**
 * Parse months from commitment label used in grouping
 * (Monthly, Yearly, Two Years, Three Years, No Commitment)
 */
export const monthsFromCommitmentLabel = (commitment: string): number => {
  const c = commitment.toLowerCase();
  if (c === "monthly") return 1;
  if (c === "yearly") return 12;
  if (c === "two years") return 24;
  if (c === "three years") return 36;
  // default: treat unknown or no commitment as monthly pricing
  return 1;
};

/**
 * Convert a per-term unit price to per-billing-cycle
 */
export const perBillingFromUnit = (
  unit: number,
  billingCycle: string,
  monthsInTerm: number | null | undefined
): number => {
  if (!monthsInTerm || monthsInTerm <= 0) return unit;
  if (billingCycle === "Monthly") {
    return unit / monthsInTerm;
  }
  if (billingCycle === "Yearly") {
    return unit / Math.max(1, monthsInTerm / 12);
  }
  return unit;
};

/**
 * Derive commitment label from ISO duration (e.g., P1M, P1Y)
 */
export const termDurationToCommitment = (termDuration?: string): string => {
  switch (termDuration) {
    case "P1M":
      return "Monthly";
    case "P1Y":
      return "Yearly";
    default:
      // Fallbacks if other durations appear (e.g., P24M, P36M)
      if (!termDuration) return "No Commitment";
      if (/^P\d+M$/.test(termDuration)) {
        const months = Number(termDuration.replace(/[^0-9]/g, ""));
        if (months === 0) return "No Commitment";
        if (months === 1) return "Monthly";
        if (months === 12) return "Yearly";
        return `${months} Months`;
      }
      return "No Commitment";
  }
};

/**
 * Normalize product name by removing NCE prefix and extra whitespace
 */
export const normalizeProductName = (name: string): string => {
  return name
    .replace(/^\(\s*NCE\s*\)\s*/i, "") // strip leading (NCE)
    .replace(/^NCE\s*[-:]?\s*/i, "") // strip leading NCE
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};
