import { useQuery } from "@tanstack/react-query";
import { CustomersResponse, Customer } from "../types/customer";
import { useAuth } from "../context/AuthContext";

const fetchAllCustomers = async (
  accessToken: string,
  pageSize: number
): Promise<CustomersResponse> => {
  const firstResponse = await fetch(
    `${
      import.meta.env.VITE_API_BASE_URL
    }/customers/Customers?PageIndex=1&PageSize=${pageSize}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!firstResponse.ok) {
    throw new Error(`HTTP error! status: ${firstResponse.status}`);
  }

  const firstResult: CustomersResponse = await firstResponse.json();
  const totalPages = firstResult.metadata?.totalPages || 1;
  let allResults: Customer[] = firstResult.results || [];

  if (totalPages > 1) {
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/customers/Customers?PageIndex=${page}&PageSize=${pageSize}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        ).then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
      );
    }
    const results = await Promise.all(pagePromises);
    results.forEach((result: CustomersResponse) => {
      allResults = allResults.concat(result.results || []);
    });
  }

  return {
    ...firstResult,
    results: allResults,
    metadata: {
      ...firstResult.metadata,
      page: 1,
      pageSize,
      totalPages: 1,
      totalRecords: allResults.length,
    },
  };
};

export const useCustomers = (pageSize = 250) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["customers", pageSize],
    queryFn: () => fetchAllCustomers(accessToken!, pageSize),
    enabled: !authLoading && !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data: data || null,
    isLoading: isLoading || authLoading,
    error,
    refetch,
  };
};
