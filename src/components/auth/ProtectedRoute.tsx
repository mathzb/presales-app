import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "../../context/SupabaseAuthContext";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allow?: (ctx: { isAdmin: boolean; role: "admin" | "user" }) => boolean;
  fallbackPath?: string;
};

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  allow,
  fallbackPath = "/access-denied",
}: ProtectedRouteProps) {
  const { loading, role, isAdmin, user } = useSupabaseAuth();
  const location = useLocation();

  if (loading) return null; // App handles global loading UI
  if (!user)
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;

  if (requireAdmin && !isAdmin) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  if (allow && !allow({ isAdmin, role })) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
