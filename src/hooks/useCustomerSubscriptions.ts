import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

interface RefundState {
  expires: string;
  type: string;
}

interface RefundableQuantityDetail {
  quantity: number;
  allowedUntil: string;
}

interface RefundableQuantity {
  totalQuantity: number;
  details: RefundableQuantityDetail[];
}

interface RenewalProduct {
  catalogueId: string;
  billingCycle: string;
  termDuration: string;
  promotionId: string;
}

interface Renewal {
  product: RenewalProduct;
  quantity: number;
  termEndDate: string;
}

interface Subscription {
  id: string;
  name: string;
  nickname: string;
  quantity: number;
  sku: string;
  promotionId: string;
  isTrial: boolean;
  autoRenewEnabled: boolean;
  status: string;
  billingCycle: string;
  termDuration: string;
  commitmentEndDate: string;
  creationDate: string;
  effectiveStartDate: string;
  parentSubscriptionId: string;
  refundStates: RefundState[];
  refundableQuantity: RefundableQuantity;
  renewal: Renewal;
  attributes: Record<string, string>;
  credentialsId: string;
}

type SubscriptionsResponse = Subscription[];

const fetchCustomerSubscriptions = async (
  accessToken: string,
  customerId: string
): Promise<SubscriptionsResponse> => {
  const response = await fetch(
    `${
      import.meta.env.VITE_API_BASE_URL
    }/microsoft/customer/${customerId}/subscriptions`,
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

export const useCustomerSubscriptions = (customerId: string | null) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customer-subscriptions", customerId],
    queryFn: () => fetchCustomerSubscriptions(accessToken!, customerId!),
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
