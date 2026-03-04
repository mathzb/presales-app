import { useQuery } from "@tanstack/react-query";
import { Customer } from "../types/customer";
import { useAuth } from "../context/AuthContext";

const fetchCustomerDetail = async (
  accessToken: string,
  customerId: string
): Promise<Customer> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/customers/Customers/${customerId}`,
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

export const useCustomerDetail = (customerId: string | null) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => fetchCustomerDetail(accessToken!, customerId!),
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
