"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthTokens, getProfile } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  setAuth: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    const storedTokens = localStorage.getItem("tokens");
    const storedUser = localStorage.getItem("user");

    if (storedTokens && storedUser) {
      const parsedTokens = JSON.parse(storedTokens);
      setTokens(parsedTokens);
      setUser(JSON.parse(storedUser));

      // Optionally:  Verify token with backend
      getProfile(parsedTokens.access)
        .then(setUser)
        .catch(() => {
          // Token invalid, clear auth
          localStorage.removeItem("tokens");
          localStorage.removeItem("user");
          setTokens(null);
          setUser(null);
        });
    }

    setIsLoading(false);
  }, []);

  const setAuth = (user: User, tokens: AuthTokens) => {
    setUser(user);
    setTokens(tokens);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("tokens", JSON.stringify(tokens));
  };

  const logoutUser = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("user");
    localStorage.removeItem("tokens");
  };

  return (
    <AuthContext.Provider
      value={{ user, tokens, setAuth, logout: logoutUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
