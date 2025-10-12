import { AdminLayout } from "@/components/Admin"
import { DashboardOverview } from "@/components/Admin/DashboardOverview"

export default function AdminPage() {
  return (
    <AdminLayout 
      title="Dashboard" 
      breadcrumbs={[{ label: "Overview" }]}
    >
      <DashboardOverview />
    </AdminLayout>
  )
}