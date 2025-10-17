"use client";

import { AdminLayout } from "@/components/Admin";
import { TourManagement } from "@/components/Admin";

export default function AdminToursPage() {
  return (
    <AdminLayout
      title="Quản lý Tour"
      breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Tour" }]}
    >
      <TourManagement />
    </AdminLayout>
  );
}
