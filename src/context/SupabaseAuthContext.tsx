import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

type Role = "admin" | "user";

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: Role;
  isAdmin: boolean;
  signIn: () => Promise<{
    data: { url?: string } | null;
    error: AuthError | null;
  }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: "user",
  isAdmin: false,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>("user");

  const deriveRole = (u: User | null): Role => {
    if (!u) return "user";
    // Prefer app_metadata for trusted roles; fall back to user_metadata
    const appMeta = ((
      u as unknown as { app_metadata?: Record<string, unknown> }
    ).app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (u.user_metadata ?? {}) as Record<string, unknown>;

    const fromAppSingle: string | undefined =
      typeof appMeta.role === "string" ? (appMeta.role as string) : undefined;
    const fromAppMany: string[] | undefined = Array.isArray(appMeta.roles)
      ? (appMeta.roles as unknown[]).filter(
          (v): v is string => typeof v === "string"
        )
      : undefined;
    const fromUserSingle: string | undefined =
      typeof userMeta.role === "string" ? (userMeta.role as string) : undefined;
    const fromUserMany: string[] | undefined = Array.isArray(userMeta.roles)
      ? (userMeta.roles as unknown[]).filter(
          (v): v is string => typeof v === "string"
        )
      : undefined;

    const values: string[] = [];
    if (fromAppSingle) values.push(fromAppSingle);
    if (fromAppMany && Array.isArray(fromAppMany)) values.push(...fromAppMany);
    if (fromUserSingle) values.push(fromUserSingle);
    if (fromUserMany && Array.isArray(fromUserMany))
      values.push(...fromUserMany);

    const normalized = values.map((v) => String(v).toLowerCase());
    if (normalized.includes("admin") || normalized.includes("administrator")) {
      return "admin";
    }
    return "user";
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(deriveRole(session?.user ?? null));
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(deriveRole(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "openid profile email offline_access",
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Sign in error:", error);
    }
    // Normalize the response to only expose url when present
    return { data: data?.url ? { url: data.url } : null, error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        isAdmin: role === "admin",
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error("useSupabaseAuth must be used within SupabaseAuthProvider");
  }
  return context;
};
