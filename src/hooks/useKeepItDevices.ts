import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const PARTNER_GUID = import.meta.env.VITE_CF_PARTNER_ID;

export interface KeepItDevice {
  id: string;
  kind: string;
  name: string;
  created: string;
  deletionDeadline: string;
  backupRetention: string;
  backupRetentionUpdated: string;
  centralConfig: string;
  fromGroup: string;
  uri: string;
  login: string;
  password: string;
  type: string;
  datacenter: string;
}

/**
 * Hook to fetch KeepIt devices for a customer
 */
export function useKeepItDevices(customerGuid: string | undefined) {
  const { accessToken } = useAuth();

  return useQuery({
    queryKey: ["keepitDevices", customerGuid],
    queryFn: async () => {
      if (!customerGuid) {
        throw new Error("Customer GUID er påkrævet");
      }

      const url = `https://portal.api.cloudfactory.dk/keepit/accounts/${PARTNER_GUID}/users/${customerGuid}/devices`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Return empty array if no devices found
          return [];
        }
        throw new Error("Kunne ikke hente KeepIt enheder");
      }

      return (await response.json()) as KeepItDevice[];
    },
    enabled: !!accessToken && !!customerGuid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
