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

        // Check localStorage for both regular and admin tokens
        const savedToken = localStorage.getItem("lutrip_token");
        const savedUser = localStorage.getItem("lutrip_user");
        const adminToken = localStorage.getItem("lutrip_admin_token");
        const adminUser = localStorage.getItem("lutrip_admin_user");

        console.log("Saved data exists:", {
          token: !!savedToken,
          user: !!savedUser,
          adminToken: !!adminToken,
          adminUser: !!adminUser
        });

        // Prioritize admin tokens if they exist
        if (adminToken && adminUser) {
          try {
            const parsedUser = JSON.parse(adminUser);
            console.log("Setting admin user from localStorage immediately");
            setUser(parsedUser);

            // Validate admin token in background
            authService
              .getProfile(adminToken)
              .then((profileResult) => {
                if (!profileResult.success || !profileResult.data) {
                  console.log("Admin token invalid, clearing auth data");
                  localStorage.removeItem("lutrip_admin_token");
                  localStorage.removeItem("lutrip_admin_user");
                  setUser(null);
                } else {
                  console.log("Admin token validated successfully");
                }
              })
              .catch((error) => {
                console.error("Admin token validation failed:", error);
                localStorage.removeItem("lutrip_admin_token");
                localStorage.removeItem("lutrip_admin_user");
                setUser(null);
              });
          } catch (parseError) {
            console.error("Error parsing saved admin user:", parseError);
            localStorage.removeItem("lutrip_admin_token");
            localStorage.removeItem("lutrip_admin_user");
            setUser(null);
          }
        } else if (savedToken && savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log("Setting regular user from localStorage immediately");
            setUser(parsedUser);

            // Validate regular token in background
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
        localStorage.removeItem("lutrip_admin_token");
        localStorage.removeItem("lutrip_admin_user");
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

    // Store token based on role
    if (userData.role === "admin") {
      // Store admin token temporarily (will be cleared when leaving admin pages)
      localStorage.setItem("lutrip_admin_token", userToken);
      localStorage.setItem("lutrip_admin_user", JSON.stringify(userData));
    } else {
      // Store regular user tokens persistently
      localStorage.setItem("lutrip_token", userToken);
      localStorage.setItem("lutrip_user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    console.log("Logging out user");
    setUser(null);
    // Clear all tokens
    localStorage.removeItem("lutrip_token");
    localStorage.removeItem("lutrip_user");
    localStorage.removeItem("lutrip_admin_token");
    localStorage.removeItem("lutrip_admin_user");
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
