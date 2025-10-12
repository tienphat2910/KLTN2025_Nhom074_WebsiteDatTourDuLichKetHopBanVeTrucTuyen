import { AdminLayout } from "@/components/Admin"
import { UserManagement } from "@/components/Admin/UserManagement"

export default function UsersPage() {
  return (
    <AdminLayout 
      title="Quản lý người dùng" 
      breadcrumbs={[{ label: "Người dùng" }]}
    >
      <UserManagement />
    </AdminLayout>
  )
}