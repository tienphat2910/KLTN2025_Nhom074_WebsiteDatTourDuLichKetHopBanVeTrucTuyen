"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import { useLoading } from "./LoadingContext";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const checkLoggedIn = async () => {
      try {
        startLoading("auth");
        const savedToken = localStorage.getItem("lutrip_token");
        const savedUser = localStorage.getItem("lutrip_user");

        if (savedToken && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error loading user data", error);
      } finally {
        setIsAuthLoading(false);
        stopLoading();
      }
    };

    checkLoggedIn();
  }, []);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    localStorage.setItem("lutrip_token", userToken);
    localStorage.setItem("lutrip_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("lutrip_token");
    localStorage.removeItem("lutrip_user");
    toast.success("Đăng xuất thành công!", {
      description: "Hẹn gặp lại bạn!",
      duration: 2000
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
