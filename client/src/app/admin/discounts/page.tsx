import { AdminLayout } from "@/components/Admin"
import { DiscountManagement } from "@/components/Admin/DiscountManagement"

export default function DiscountsPage() {
  return (
    <AdminLayout 
      title="Quản lý mã giảm giá" 
      breadcrumbs={[{ label: "Mã giảm giá" }]}
    >
      <DiscountManagement />
    </AdminLayout>
  )
}