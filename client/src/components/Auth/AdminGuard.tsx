"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/Loading";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading) {
      // If not authenticated, redirect to login
      if (!user) {
        router.push(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      // If authenticated but not admin, redirect to home
      if (user.role !== "admin") {
        router.push("/");
        return;
      }
    }
  }, [user, isAuthLoading, router]);

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

  // If not authenticated or not admin, don't render children
  if (!user || user.role !== "admin") {
    return null;
  }

  // Render children if admin
  return <>{children}</>;
}
