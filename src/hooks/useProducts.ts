import { useQuery } from "@tanstack/react-query";
import { ProductsResponse, ProductResult } from "../types/product";
import { useAuth } from "../context/AuthContext";

const fetchAllProducts = async (
  accessToken: string,
  pageSize: number
): Promise<ProductsResponse> => {
  const firstResponse = await fetch(
    `${
      import.meta.env.VITE_API_BASE_URL
    }/catalogue/Products?PageIndex=1&PageSize=${pageSize}&includePrice=true`,
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

  const firstResult: ProductsResponse = await firstResponse.json();
  const totalPages = firstResult.metadata?.totalPages || 1;
  let allResults: ProductResult[] = firstResult.results || [];

  if (totalPages > 1) {
    const pagePromises = [];
    for (let page = 2; page <= totalPages; page++) {
      pagePromises.push(
        fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/catalogue/Products?PageIndex=${page}&PageSize=${pageSize}&includePrice=true`,
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
    results.forEach((result: ProductsResponse) => {
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

export const useProducts = (pageSize = 250) => {
  const { accessToken, isLoading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", pageSize],
    queryFn: () => fetchAllProducts(accessToken!, pageSize),
    enabled: !authLoading && !!accessToken,
    staleTime: 30 * 60 * 1000,
  });

  return {
    data: data || null,
    isLoading: isLoading || authLoading,
    error,
    refetch,
  };
};
