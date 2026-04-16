import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, apiRequest, type ApiUser, type AuthResponse } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  accessToken: string | null;
  isInitializing: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    favoriteSport?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
}

const STORAGE_KEY = "aetherscore.auth";

const AuthContext = createContext<AuthContextValue | null>(null);

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
}

const saveStored = (value: StoredAuth) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const readStored = (): StoredAuth | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
};

const clearStored = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setSession = (data: AuthResponse) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    saveStored({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  };

  useEffect(() => {
    const stored = readStored();
    if (!stored) {
      setIsInitializing(false);
      return;
    }

    apiRequest<AuthResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: stored.refreshToken })
    })
      .then((res) => setSession(res))
      .catch(() => clearStored())
      .finally(() => setIsInitializing(false));
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const result = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setSession(result);
  };

  const register = async (payload: {
    fullName: string;
    email: string;
    password: string;
    favoriteSport?: string;
  }) => {
    const result = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setSession(result);
  };

  const logout = async () => {
    if (refreshToken) {
      await apiRequest<{ ok: boolean }>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      }).catch(() => undefined);
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    clearStored();
  };

  const authFetch = async <T,>(path: string, options: RequestInit = {}) => {
    if (!accessToken) {
      throw new ApiError("Unauthorized", 401);
    }

    try {
      return await apiRequest<T>(path, options, accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || !refreshToken) {
        throw error;
      }

      const refreshed = await apiRequest<AuthResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken })
      });

      setSession(refreshed);
      return apiRequest<T>(path, options, refreshed.accessToken);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isInitializing,
      login,
      register,
      logout,
      authFetch
    }),
    [user, accessToken, refreshToken, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
