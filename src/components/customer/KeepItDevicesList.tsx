import {
  Server,
  Calendar,
  HardDrive,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KeepItDevice } from "../../hooks/useKeepItDevices";
import { useKeepItDeviceHealth } from "../../hooks/useKeepItDeviceHealth";
import { useKeepItDeviceResources } from "../../hooks/useKeepItDeviceResources";
import { format } from "date-fns";
import { da } from "date-fns/locale";

interface KeepItDeviceCardProps {
  device: KeepItDevice;
  customerGuid: string;
}

export function KeepItDeviceCard({
  device,
  customerGuid,
}: KeepItDeviceCardProps) {
  const isDeleting =
    device.deletionDeadline && new Date(device.deletionDeadline) > new Date();

  const { data: health, isLoading: healthLoading } = useKeepItDeviceHealth(
    customerGuid,
    device.id
  );

  const { data: resources, isLoading: resourcesLoading } =
    useKeepItDeviceResources(customerGuid, device.id);

  // Determine health status badge
  const getHealthBadge = () => {
    if (healthLoading) {
      return (
        <Badge variant="outline" className="text-xs">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Henter...
        </Badge>
      );
    }

    if (!health) {
      return null;
    }

    if (health.status === "Healthy") {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Healthly
        </Badge>
      );
    }

    if (health.status === "Unhealthy") {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Unhealthly
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        {health.status}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">{device.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {device.kind}
                </Badge>
                {device.type && (
                  <Badge variant="secondary" className="text-xs">
                    {device.type}
                  </Badge>
                )}
                {getHealthBadge()}
              </div>
            </div>
          </div>
          {isDeleting && (
            <Badge variant="destructive" className="text-xs">
              Slettes snart
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {device.login && (
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Login</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {device.login}
                </p>
              </div>
            </div>
          )}

          {device.datacenter && (
            <div className="flex items-start gap-2">
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Datacenter</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {device.datacenter}
                </p>
              </div>
            </div>
          )}

          {device.backupRetention && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Backup Retention
                </p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {device.backupRetention}
                </p>
              </div>
            </div>
          )}

          {device.created && (
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Oprettet</p>
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  {format(new Date(device.created), "d. MMM yyyy", {
                    locale: da,
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resources section */}
        {resources && resources.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <p className="text-xs font-semibold text-muted-foreground">
                Resources
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-slate-50 dark:bg-gray-900 p-2 rounded"
                >
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {resource.name}
                  </span>
                  <span className="text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    {resource.usage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {resourcesLoading && (
          <div className="pt-3 border-t border-slate-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-xs">Henter resources...</p>
            </div>
          </div>
        )}

        {device.uri && (
          <div className="pt-2 border-t border-slate-200 dark:border-gray-700">
            <p className="text-xs text-muted-foreground mb-1">URI</p>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-50 dark:bg-gray-900 p-2 rounded break-all">
              {device.uri}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KeepItDevicesListProps {
  devices: KeepItDevice[];
  isLoading: boolean;
  error: Error | null;
  customerGuid: string;
}

export function KeepItDevicesList({
  devices,
  isLoading,
  error,
  customerGuid,
}: KeepItDevicesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-slate-600 dark:text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">
            {error instanceof Error
              ? error.message
              : "Kunne ikke indlæse KeepIt enheder"}
          </p>
        </div>
      </div>
    );
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-gray-900 rounded-lg p-12 text-center">
        <Server className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium mb-2">
          Ingen KeepIt enheder fundet
        </p>
        <p className="text-slate-500 dark:text-slate-500 text-sm">
          Denne kunde har ingen aktive KeepIt enheder
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <KeepItDeviceCard
          key={device.id}
          device={device}
          customerGuid={customerGuid}
        />
      ))}
    </div>
  );
}
