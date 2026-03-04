import { ProductResult } from "../types/product";

export interface ProductVariant {
  commitment: string;
  billingCycle: string;
  productResult: ProductResult;
}

export interface GroupedProduct {
  baseName: string;
  variants: ProductVariant[];
  defaultVariant: ProductVariant;
}

function extractCommitment(product: ProductResult): string {
  const term = product.product.recursionTerm;
  if (term === 0) return "No Commitment";
  if (term === 1) return "Monthly";
  if (term === 12) return "Yearly";
  if (term === 24) return "Two Years";
  if (term === 36) return "Three Years";
  return `${term} Months`;
}

function extractBillingCycle(product: ProductResult): string {
  const term = product.product.billingTerm;
  if (term === 1) return "Monthly";
  if (term === 12) return "Yearly";
  return `${term} Months`;
}

function extractBaseName(name: string): string {
  return name
    .replace(
      /\s*-\s*(No Commitment|1 Month|12 Months|24 Months|36 Months)\s*-\s*(Monthly|Yearly)/gi,
      ""
    )
    .replace(
      /\s*-\s*(Monthly|Yearly)\s*-\s*(No Commitment|1 Month|12 Months|24 Months|36 Months)/gi,
      ""
    )
    .replace(
      /\s*-\s*(No Commitment|1 Month|12 Months|24 Months|36 Months)/gi,
      ""
    )
    .replace(/\s*-\s*(Monthly|Yearly)/gi, "")
    .trim();
}

export function groupProductsByVariants(
  products: ProductResult[]
): GroupedProduct[] {
  const grouped = new Map<string, ProductVariant[]>();

  products.forEach((productResult) => {
    const baseName = extractBaseName(productResult.product.name);
    const commitment = extractCommitment(productResult);
    const billingCycle = extractBillingCycle(productResult);

    const variant: ProductVariant = {
      commitment,
      billingCycle,
      productResult,
    };

    if (!grouped.has(baseName)) {
      grouped.set(baseName, []);
    }
    grouped.get(baseName)!.push(variant);
  });

  const result: GroupedProduct[] = [];

  grouped.forEach((variants, baseName) => {
    if (variants.length === 1) {
      result.push({
        baseName: variants[0].productResult.product.name,
        variants,
        defaultVariant: variants[0],
      });
    } else {
      variants.sort((a, b) => {
        const commitmentOrder = [
          "No Commitment",
          "1 Month",
          "12 Months",
          "24 Months",
          "36 Months",
        ];
        const billingOrder = ["Monthly", "Yearly"];

        const commitmentDiff =
          commitmentOrder.indexOf(a.commitment) -
          commitmentOrder.indexOf(b.commitment);
        if (commitmentDiff !== 0) return commitmentDiff;

        return (
          billingOrder.indexOf(a.billingCycle) -
          billingOrder.indexOf(b.billingCycle)
        );
      });

      result.push({
        baseName,
        variants,
        defaultVariant: variants[0],
      });
    }
  });

  return result.sort((a, b) => a.baseName.localeCompare(b.baseName));
}
