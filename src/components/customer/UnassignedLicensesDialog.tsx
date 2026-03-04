import { AlertTriangle, Users, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnassignedLicensesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  totalLicenses: number;
  consumedLicenses: number;
  newQuantity: number;
}

export default function UnassignedLicensesDialog({
  isOpen,
  onClose,
  onConfirm,
  productName,
  totalLicenses,
  consumedLicenses,
  newQuantity,
}: UnassignedLicensesDialogProps) {
  const unassignedLicenses = totalLicenses - consumedLicenses;
  const hasUnassigned = unassignedLicenses > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg">
              {hasUnassigned
                ? "Ubrugte licenser fundet"
                : "Eksisterende licenser fundet"}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              {hasUnassigned
                ? `Kunden har ${unassignedLicenses} ubrugte licens${
                    unassignedLicenses > 1 ? "er" : ""
                  } for dette produkt. Det anbefales at tildele disse før der provisioners nye.`
                : "Kunden har allerede licenser for dette produkt. Kontroller om der er behov for yderligere licenser."}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Card className="bg-muted">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Produkt:</p>
              <p className="text-sm font-semibold">{productName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Total licenser
                    </p>
                  </div>
                  <p className="text-xl font-bold">{totalLicenses}</p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <UserCheck className="w-3 h-3 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-muted-foreground">Tildelt</p>
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {consumedLicenses}
                  </p>
                </CardContent>
              </Card>
            </div>

            {hasUnassigned && (
              <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
                        Ubrugte licenser
                      </p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {unassignedLicenses}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                    >
                      Kan tildeles
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Nye licenser som tilføjes:
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  +{newQuantity}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-semibold">Total efter provision:</p>
                <p className="text-xl font-bold">
                  {totalLicenses + newQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          {hasUnassigned
            ? "⚠️ Overvej at tildele eksisterende licenser før tilføjelse af nye"
            : "⚠️ Sørg for at kunden har behov for yderligere licenser"}
        </p>

        <DialogFooter className="flex-row justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Annuller
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            Provisionér alligevel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
