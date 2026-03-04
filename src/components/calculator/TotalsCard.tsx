import { Calculator, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TotalsCardProps {
  showMonthly: boolean;
  yearlyCost: number;
  monthlyCost: number;
  yearlySale: number;
  monthlySale: number;
  yearlyProfit: number;
  monthlyProfit: number;
  profitMargin: number;
  currency: string;
}

export default function TotalsCard({
  showMonthly,
  yearlyCost,
  monthlyCost,
  yearlySale,
  monthlySale,
  yearlyProfit,
  monthlyProfit,
  profitMargin,
  currency,
}: TotalsCardProps) {
  return (
    <div className="w-full lg:w-96">
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700 border-blue-200 dark:border-gray-600 lg:sticky lg:top-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            {showMonthly ? "Månedlige" : "Årlige"} totaler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Total kostpris
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    showMonthly ? monthlyCost : yearlyCost,
                    currency,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total salg</p>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    showMonthly ? monthlySale : yearlySale,
                    currency,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Total fortjeneste
                </p>
                <p
                  className={`text-2xl font-bold ${
                    yearlyProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {yearlyProfit >= 0 ? "+" : ""}
                  {formatCurrency(
                    showMonthly ? monthlyProfit : yearlyProfit,
                    currency,
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">
                  Fortjenstmargen
                </p>
                <p
                  className={`text-2xl font-bold ${
                    profitMargin >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {profitMargin.toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {yearlyProfit < 0 && (
            <Card className="mt-4 bg-red-100 border-red-300">
              <CardContent className="p-3">
                <p className="text-xs text-red-800 font-medium">
                  Advarsel: Nuværende konfiguration resulterer i et tab.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
