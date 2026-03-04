import { CheckCircle, XCircle, Clock, Package, Shield } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import {
  monthsFromTermDuration,
  perBillingFromUnit,
} from "../../utils/productHelpers";
import type { ProductResult } from "../../types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Subscription {
  id: string;
  name: string;
  nickname?: string;
  sku?: string;
  status: string;
  quantity: number;
  billingCycle: string;
  termDuration: string;
  autoRenewEnabled: boolean;
  isTrial: boolean;
  creationDate: string;
  commitmentEndDate?: string | null;
  renewal?: {
    product?: {
      catalogueId?: string;
    };
  };
}

interface GroupedSubscription {
  key: string;
  items: Subscription[];
}

interface SubscriptionCardProps {
  group: GroupedSubscription;
  isExpanded: boolean;
  onToggleExpand: (key: string) => void;
  resolveProductForSubscription: (subscription: {
    nickname?: string;
    name: string;
    sku?: string;
    termDuration: string;
    billingCycle: string;
    renewal?: {
      product?: {
        catalogueId?: string;
      };
    };
  }) => ProductResult | undefined;
  displayCurrency: string;
}

export default function SubscriptionCard({
  group,
  isExpanded,
  onToggleExpand,
  resolveProductForSubscription,
  displayCurrency,
}: SubscriptionCardProps) {
  const { key, items } = group;
  const representative = items[0];
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <Card
      key={key}
      className="hover:border-slate-300 dark:hover:border-gray-600 transition-colors"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-lg">
              {representative.nickname || representative.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                representative.status.toLowerCase() === "active"
                  ? "default"
                  : "secondary"
              }
              className={
                representative.status.toLowerCase() === "active"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                  : ""
              }
            >
              {representative.status.toLowerCase() === "active" ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {representative.status}
            </Badge>
            {representative.isTrial && (
              <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50">
                <Clock className="w-3 h-3 mr-1" />
                Prøveperiode
              </Badge>
            )}
            {items.length > 1 && (
              <Badge variant="outline">
                <Package className="w-3 h-3 mr-1" />
                Kombineret: {items.length}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleExpand(key)}
              aria-expanded={isExpanded}
              aria-controls={`subs-${key}`}
            >
              {isExpanded ? "Skjul detaljer" : "Vis detaljer"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Samlet antal</p>
              <p className="text-xl font-bold">{totalQuantity}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Fakturering</p>
              <p className="text-sm font-semibold">
                {representative.billingCycle === "Monthly"
                  ? "Månedlig"
                  : representative.billingCycle === "Yearly"
                  ? "Årlig"
                  : representative.billingCycle === "OneTime"
                  ? "Engangsbetaling"
                  : representative.billingCycle}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Abonnementsperiode
              </p>
              <p className="text-sm font-semibold">
                {representative.termDuration === "P1M"
                  ? "Månedlig"
                  : representative.termDuration === "P1Y"
                  ? "Årlig"
                  : representative.termDuration}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Auto-fornyelse
              </p>
              <p className="text-sm font-semibold">
                {representative.autoRenewEnabled ? "Aktiveret" : "Deaktiveret"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Price info using representative, total across group */}
        {(() => {
          const pr = resolveProductForSubscription(representative);
          const unit =
            typeof pr?.price?.sale === "number"
              ? (pr!.price.sale as number)
              : (pr?.price?.cost as number | undefined);
          const currency = pr?.price?.currency || displayCurrency || "DKK";
          const hasPrice = typeof unit === "number" && !isNaN(unit as number);
          if (!hasPrice) return null;

          const monthsInTerm = monthsFromTermDuration(
            representative.termDuration
          );
          const perBillingUnit = perBillingFromUnit(
            unit as number,
            representative.billingCycle,
            monthsInTerm
          );
          const perLicense = formatCurrency(perBillingUnit, currency);
          const total = formatCurrency(
            perBillingUnit * totalQuantity,
            currency
          );
          const cycleLabel =
            representative.billingCycle === "Monthly" ? "/ måned" : "/ år";

          return (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    Pris pr. licens
                  </p>
                  <p className="text-sm font-semibold">
                    {perLicense} {cycleLabel}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="text-sm font-semibold">
                    {total} {cycleLabel}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Expanded list of individual subscriptions in the group */}
        {isExpanded && (
          <div
            id={`subs-${key}`}
            className="mt-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-gray-700"
          >
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 bg-white dark:bg-gray-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <div className="col-span-4 p-2 border-r border-slate-200 dark:border-gray-700">
                  Oprettet
                </div>
                <div className="col-span-4 p-2 border-r border-slate-200 dark:border-gray-700">
                  Commitment slutter
                </div>
                <div className="col-span-2 p-2 border-r border-slate-200 dark:border-gray-700">
                  Antal
                </div>
                <div className="col-span-2 p-2">Status</div>
              </div>
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid grid-cols-12 text-sm bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 dark:text-slate-300"
                >
                  <div className="col-span-4 p-2">
                    {new Date(it.creationDate).toLocaleDateString("da-DK", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="col-span-4 p-2">
                    {it.commitmentEndDate
                      ? new Date(it.commitmentEndDate).toLocaleDateString(
                          "da-DK",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "-"}
                  </div>
                  <div className="col-span-2 p-2">{it.quantity}</div>
                  <div className="col-span-2 p-2">{it.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
