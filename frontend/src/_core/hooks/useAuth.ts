import { useState, useEffect, useCallback } from "react";
import { authApi } from "../../services/apiService";

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
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ user: null, loading: false, error: null, isAuthenticated: false });
      return;
    }

    authApi
      .me()
      .then((res) => {
        setState({ user: res.data, loading: false, error: null, isAuthenticated: true });
      })
      .catch(() => {
        localStorage.removeItem("token");
        setState({ user: null, loading: false, error: null, isAuthenticated: false });
      });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem("token");
      setState({ user: null, loading: false, error: null, isAuthenticated: false });
    }
  }, []);

  return {
    ...state,
    refresh: () => {
      // Re-fetch user data
    },
    logout,
  };
}
