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
import { authService } from "@/services/authService";

interface User {
  _id?: string;
  id?: string;
  email: string;
  fullName: string;
  avatar?: string;
  phone?: string;
  role?: string;
  isVerified?: boolean;
  firebaseUid?: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const { startLoading, stopLoading } = useLoading();

  // Computed property for authentication status
  const isAuthenticated = !!user;

  useEffect(() => {
    // Only run auth check once
    if (hasCheckedAuth) return;

    const checkLoggedIn = async () => {
      try {
        console.log("Starting initial auth check...");

        // Check localStorage first (synchronous)
        const savedToken = localStorage.getItem("lutrip_token");
        const savedUser = localStorage.getItem("lutrip_user");

        console.log("Saved data exists:", {
          token: !!savedToken,
          user: !!savedUser
        });

        if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log("Setting user from localStorage immediately");

            // Set user immediately to prevent redirect
            setUser(parsedUser);

            // Then validate token in background (don't await)
            authService
              .getProfile(savedToken)
              .then((profileResult) => {
                if (!profileResult.success || !profileResult.data) {
                  console.log("Token invalid, clearing auth data");
                  localStorage.removeItem("lutrip_token");
                  localStorage.removeItem("lutrip_user");
                  setUser(null);
                } else {
                  console.log("Token validated successfully");
                }
              })
              .catch((error) => {
                console.error("Token validation failed:", error);
                localStorage.removeItem("lutrip_token");
                localStorage.removeItem("lutrip_user");
                setUser(null);
              });
          } catch (parseError) {
            console.error("Error parsing saved user:", parseError);
            localStorage.removeItem("lutrip_token");
            localStorage.removeItem("lutrip_user");
            setUser(null);
          }
        } else {
          console.log("No saved auth data found");
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth check:", error);
        localStorage.removeItem("lutrip_token");
        localStorage.removeItem("lutrip_user");
        setUser(null);
      } finally {
        console.log("Auth check completed");
        setIsAuthLoading(false);
        setHasCheckedAuth(true);
      }
    };

    // Run immediately without timeout
    checkLoggedIn();
  }, [hasCheckedAuth]);

  const login = (userData: User, userToken: string) => {
    console.log("Logging in user:", userData.email);
    setUser(userData);
    localStorage.setItem("lutrip_token", userToken);
    localStorage.setItem("lutrip_user", JSON.stringify(userData));
  };

  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    localStorage.removeItem("lutrip_token");
    localStorage.removeItem("lutrip_user");
    setHasCheckedAuth(false); // Reset auth check flag
    toast.success("Đăng xuất thành công!", {
      description: "Hẹn gặp lại bạn!",
      duration: 2000
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAuthLoading, login, logout }}
    >
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
