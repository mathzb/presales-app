import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const PARTNER_GUID = import.meta.env.VITE_CF_PARTNER_ID;

export interface KeepItDeviceResource {
  name: string;
  usage: number;
}

/**
 * Hook to fetch resources for a KeepIt device
 */
export function useKeepItDeviceResources(
  customerGuid: string | undefined,
  deviceId: string | undefined
) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["keepitDeviceResources", customerGuid, deviceId],
    queryFn: async () => {
      if (!customerGuid || !deviceId) {
        throw new Error("Customer GUID og Device ID er påkrævet");
      }

      const url = `https://portal.api.cloudfactory.dk/keepit/accounts/${PARTNER_GUID}/users/${customerGuid}/devices/${deviceId}/resources`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array if resources not available
          return [];
        }
        throw new Error("Kunne ikke hente device resources");
      }

      return (await response.json()) as KeepItDeviceResource[];
    },
    enabled: !!accessToken && !!customerGuid && !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
