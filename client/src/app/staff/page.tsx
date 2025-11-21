"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/Admin";
import { DashboardOverview } from "@/components/Admin/DashboardOverview";
import { Loader2 } from "lucide-react";

export default function StaffPage() {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();

  // Redirect if not staff
  if (!isAuthLoading && user?.role !== "staff") {
    router.push("/");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="Dashboard - Nhân viên"
      breadcrumbs={[{ label: "Tổng quan" }]}
    >
      <DashboardOverview />
    </AdminLayout>
  );
}
