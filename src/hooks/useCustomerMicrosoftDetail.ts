import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

interface CompanyProfile {
  domain: string;
  organizationRegistrationNumber: string;
  companyName: string;
}

interface BillingProfile {
  email: string;
  culture: string;
  language: string;
  companyName: string;
  defaultAddress: {
    country: string;
    city: string;
    state: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
}

interface Customer {
  id: string;
  billingProfile: BillingProfile;
  companyProfile?: CompanyProfile;
}

type CustomerResponse = Customer[];

const fetchCustomer = async (
  accessToken: string,
  customerId: string
): Promise<CustomerResponse> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/microsoft/customer/${customerId}`,
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

export const useCustomerMicrosoftDetail = (customerId: string | null) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["microsoft-customer", customerId],
    queryFn: () => fetchCustomer(accessToken!, customerId!),
    enabled: !authLoading && !!accessToken && !!customerId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data || null,
    isLoading: isLoading || authLoading,
    error,
    refetch,
  };
};
