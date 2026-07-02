"use client";

import { useState, useEffect, useCallback } from "react";
import { authApi } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UseAuthState = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
};

export function useAuth() {
  const [state, setState] = useState<UseAuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("unitycare_token") || localStorage.getItem("token");
    if (!token) {
      setState({ user: null, loading: false, error: null, isAuthenticated: false });
      return;
    }

    authApi
      .me()
      .then((data: unknown) => {
        const d = data as Record<string, unknown>;
        setState({ user: (d.user || d) as User, loading: false, error: null, isAuthenticated: true });
      })
      .catch(() => {
        localStorage.removeItem("unitycare_token");
        localStorage.removeItem("token");
        setState({ user: null, loading: false, error: null, isAuthenticated: false });
      });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem("unitycare_token");
    localStorage.removeItem("token");
    setState({ user: null, loading: false, error: null, isAuthenticated: false });
  }, []);

  return { ...state, logout };
}
