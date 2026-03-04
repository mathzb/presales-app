import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

export type Promotion = {
  msPromotionId: string;
  acceptedTrustCriteria: boolean;
};

export type ProvisionItem = {
  catalogueId: string;
  quantity: number;
  autoRenew: boolean;
  promotion?: Promotion | null;
  alignedEndDate?: string | null;
};

export const useProvisionMicrosoftSubscription = (
  customerId: string
): UseMutationResult<unknown, Error, ProvisionItem[], unknown> => {
  const { accessToken } = useAuth();

  const doProvision = async (items: ProvisionItem[]) => {
    if (!accessToken) {
      throw new Error("No access token available for provisioning");
    }
    const res = await fetch(
      `${
        import.meta.env.VITE_API_BASE_URL
      }/microsoft/customer/${customerId}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(items),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Provision failed: ${res.status} ${text}`);
    }

    return res.json();
  };

  const mutationFn = async (items: ProvisionItem[]) => doProvision(items);

  // useMutation has two common overloads: (mutationFn, options) or (options).
  // Provide the mutationFn as first argument with proper generics to satisfy TS.
  // Use options form which worked reliably across builds/environments.
  const result = useMutation<unknown, Error, ProvisionItem[], unknown>({
    mutationFn,
  });

  return result;
};
