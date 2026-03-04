import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const PARTNER_GUID = import.meta.env.VITE_CF_PARTNER_ID;

export interface KeepItDeviceHealth {
  status: "Healthy" | "Unhealthy" | string;
}

/**
 * Hook to fetch health status for a KeepIt device
 */
export function useKeepItDeviceHealth(
  customerGuid: string | undefined,
  deviceId: string | undefined
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["keepitDeviceHealth", customerGuid, deviceId],
    queryFn: async () => {
      if (!customerGuid || !deviceId) {
        throw new Error("Customer GUID og Device ID er påkrævet");
      }

      const url = `https://portal.api.cloudfactory.dk/keepit/accounts/${PARTNER_GUID}/users/${customerGuid}/devices/${deviceId}/health`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return null if health data not available
          return null;
        }
        throw new Error("Kunne ikke hente device health status");
      }

      return (await response.json()) as KeepItDeviceHealth;
    },
    enabled: !!accessToken && !!customerGuid && !!deviceId,
    staleTime: 2 * 60 * 1000, // 2 minutes (health data changes more frequently)
    retry: 1, // Only retry once for health checks
  });
}
