import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

interface ServicePlan {
  id: string;
  appliesTo: string;
  provisioningStatus: string;
  servicePlanId: string;
  servicePlanName: string;
  displayName: string;
}

interface UnitDetails {
  total: number;
  suspended: number;
  warning: number;
  consumed: number;
}

export interface CustomerLicense {
  id: string;
  tenantId: {
    id: string;
  };
  capabilityStatus: string;
  unitDetails: UnitDetails;
  servicePlans: ServicePlan[];
  skuId: string;
  skuPartNumber: string;
  appliesTo: string;
  displayName: string;
  lastUpdatedUtc: string;
}

type CustomerLicensesResponse = CustomerLicense[];

const fetchCustomerLicenses = async (
  accessToken: string,
  customerId: string
): Promise<CustomerLicensesResponse> => {
  const response = await fetch(
    `${
      import.meta.env.VITE_API_BASE_URL
    }/microsoft/customer/${customerId}/licenses`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useCustomerLicenses = (customerId: string | null) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customer-licenses", customerId],
    queryFn: () => fetchCustomerLicenses(accessToken!, customerId!),
    enabled: !authLoading && !!accessToken && !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes - license data changes frequently
  });

  return {
    data: data || [],
    isLoading: isLoading || authLoading,
    error,
    refetch,
  };
};
