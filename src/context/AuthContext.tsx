import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  accessToken: string | null;
  isLoading: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  isLoading: true,
  refreshToken: async () => {},
});

const REFRESH_URL = `https://portal.api.cloudfactory.dk/Authenticate/ExchangeRefreshToken/${
  import.meta.env.VITE_REFRESHTOKEN
}?customer=false`;

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

function getStoredToken() {
  const token = localStorage.getItem("accessToken");
  const expiresAt = Number(localStorage.getItem("expiresAt"));
  return { token, expiresAt };
}

function storeToken(token: string, expiresAt: number) {
  localStorage.setItem("accessToken", token);
  localStorage.setItem("expiresAt", String(expiresAt));
}

function clearStoredToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("expiresAt");
}

async function fetchAccessToken(): Promise<{
  token: string;
  expiresAt: number;
}> {
  const res = await fetch(REFRESH_URL);
  if (!res.ok) throw new Error("Failed to fetch token");

  const data: TokenResponse = await res.json();
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  storeToken(data.access_token, expiresAt);

  return {
    token: data.access_token,
    expiresAt,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const queryClient = useQueryClient();

  const shouldFetchNewToken = () => {
    const { token, expiresAt: storedExpiresAt } = getStoredToken();
    const now = Math.floor(Date.now() / 1000);
    return !token || !storedExpiresAt || storedExpiresAt - now <= 120;
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth-token"],
    queryFn: fetchAccessToken,
    enabled: shouldFetchNewToken(),
    staleTime: 50 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (data) {
      setAccessToken(data.token);
      setExpiresAt(data.expiresAt);
    } else if (!isLoading && !shouldFetchNewToken()) {
      const { token, expiresAt: storedExpiresAt } = getStoredToken();
      setAccessToken(token);
      setExpiresAt(storedExpiresAt);
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!expiresAt) return;

    const now = Math.floor(Date.now() / 1000);
    const timeout = expiresAt - now - 60;

    if (timeout > 0) {
      const timer = setTimeout(() => {
        refetch();
      }, timeout * 1000);
      return () => clearTimeout(timer);
    } else if (expiresAt - now <= 120) {
      refetch();
    }
  }, [expiresAt, refetch]);

  async function refreshToken() {
    try {
      await refetch();
    } catch {
      setAccessToken(null);
      setExpiresAt(0);
      clearStoredToken();
      queryClient.invalidateQueries({ queryKey: ["auth-token"] });
    }
  }

  return (
    <AuthContext.Provider value={{ accessToken, isLoading, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
