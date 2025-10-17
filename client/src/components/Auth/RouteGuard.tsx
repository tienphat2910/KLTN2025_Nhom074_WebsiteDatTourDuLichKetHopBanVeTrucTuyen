"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/Loading";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthLoading) {
      const isAdminRoute = pathname.startsWith("/admin");
      const isStaffRoute = pathname.startsWith("/staff");
      const isAuthRoute =
        pathname === "/login" ||
        pathname === "/register" ||
        pathname === "/forgot-password" ||
        pathname === "/email-verified";

      // Skip guard for auth routes
      if (isAuthRoute) return;

      // Handle admin routes
      if (isAdminRoute) {
        if (!user) {
          // Not logged in, redirect to login with admin redirect
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        if (user.role !== "admin") {
          // Logged in but not admin, redirect to login (will logout current user)
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        // Admin accessing admin routes - allow
        return;
      }

      // Handle staff routes
      if (isStaffRoute) {
        if (!user) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        if (user.role !== "staff" && user.role !== "admin") {
          router.push("/");
          return;
        }
        // Staff or admin accessing staff routes - allow
        return;
      }

      // Handle regular user routes
      if (user && user.role === "admin") {
        // Admin user accessing non-admin routes - logout admin
        console.log("Admin accessing non-admin route, logging out");
        // Clear admin tokens and user data
        localStorage.removeItem("lutrip_admin_token");
        localStorage.removeItem("lutrip_admin_user");
        // Force logout by clearing user state
        window.location.href = "/login";
        return;
      }
    }
  }, [user, isAuthLoading, pathname, router]);

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          type="travel"
          size="lg"
          text="Đang kiểm tra quyền truy cập..."
        />
      </div>
    );
  }

  // Render children if no redirect needed
  return <>{children}</>;
}
