"use client"

import { useState } from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  Clock,
  Users
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Discount, DiscountFormData, DiscountType } from "@/types/discount"
import { DiscountModal } from "./DiscountModal"

// Mock data for discounts
const mockDiscounts: Discount[] = [
  {
    _id: "1",
    code: "SUMMER2024",
    description: "Giảm giá mùa hè 2024",
    discountType: "percentage",
    value: 20,
    validFrom: new Date("2024-06-01"),
    validUntil: new Date("2024-08-31"),
    usageLimit: 1000,
    usedCount: 245
  },
  {
    _id: "2",
    code: "WELCOME50K",
    description: "Mã giảm giá chào mừng thành viên mới",
    discountType: "fixed",
    value: 50000,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    usageLimit: 500,
    usedCount: 123
  },
  {
    _id: "3",
    code: "FLASH15",
    description: "Flash sale cuối tuần",
    discountType: "percentage",
    value: 15,
    validFrom: new Date("2024-10-12"),
    validUntil: new Date("2024-10-14"),
    usageLimit: 200,
    usedCount: 189
  },
  {
    _id: "4",
    code: "LOYALTY100K",
    description: "Ưu đãi khách hàng thân thiết",
    discountType: "fixed",
    value: 100000,
    validFrom: new Date("2024-01-01"),
    validUntil: new Date("2024-12-31"),
    usageLimit: 100,
    usedCount: 67
  },
  {
    _id: "5",
    code: "NEWYEAR2025",
    description: "Chúc mừng năm mới 2025",
    discountType: "percentage",
    value: 25,
    validFrom: new Date("2024-12-25"),
    validUntil: new Date("2025-01-05"),
    usageLimit: 300,
    usedCount: 0
  }
]

const discountTypeLabels = {
  percentage: "Phần trăm",
  fixed: "Số tiền cố định"
}

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>(mockDiscounts)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)

  // Helper function to check if discount is active
  const isDiscountActive = (discount: Discount) => {
    const now = new Date()
    return now >= discount.validFrom && now <= discount.validUntil
  }

  // Helper function to check if discount is expired
  const isDiscountExpired = (discount: Discount) => {
    const now = new Date()
    return now > discount.validUntil
  }

  // Helper function to check if discount is upcoming
  const isDiscountUpcoming = (discount: Discount) => {
    const now = new Date()
    return now < discount.validFrom
  }

  // Helper function to get discount status
  const getDiscountStatus = (discount: Discount) => {
    if (discount.usedCount >= discount.usageLimit) return "exhausted"
    if (isDiscountExpired(discount)) return "expired"
    if (isDiscountUpcoming(discount)) return "upcoming"
    if (isDiscountActive(discount)) return "active"
    return "inactive"
  }

  // Filter discounts based on search and filters
  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch = discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         discount.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === "all" || discount.discountType === typeFilter
    
    const status = getDiscountStatus(discount)
    const matchesStatus = statusFilter === "all" || status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  const handleDiscountAction = (action: string, discountId: string) => {
    switch (action) {
      case "copy":
        navigator.clipboard.writeText(discounts.find(d => d._id === discountId)?.code || "")
        break
      case "delete":
        setDiscounts(prev => prev.filter(d => d._id !== discountId))
        break
      default:
        break
    }
  }

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount)
    setIsModalOpen(true)
  }

  const handleAddDiscount = () => {
    setEditingDiscount(null)
    setIsModalOpen(true)
  }

  const handleSaveDiscount = (discountData: DiscountFormData) => {
    if (editingDiscount) {
      // Update existing discount
      setDiscounts(prev => prev.map(discount => 
        discount._id === editingDiscount._id 
          ? { ...discount, ...discountData }
          : discount
      ))
    } else {
      // Add new discount
      const newDiscount: Discount = {
        ...discountData,
        _id: (discounts.length + 1).toString(),
        usedCount: 0
      }
      setDiscounts(prev => [...prev, newDiscount])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const getStatusBadge = (discount: Discount) => {
    const status = getDiscountStatus(discount)
    
    switch (status) {
      case "active":
        return <Badge variant="default">Đang hoạt động</Badge>
      case "expired":
        return <Badge variant="destructive">Đã hết hạn</Badge>
      case "upcoming":
        return <Badge variant="secondary">Sắp diễn ra</Badge>
      case "exhausted":
        return <Badge variant="outline">Đã hết lượt</Badge>
      default:
        return <Badge variant="secondary">Không hoạt động</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý mã giảm giá</h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các mã giảm giá cho khách hàng
          </p>
        </div>
        <Button onClick={handleAddDiscount}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo mã giảm giá
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng mã giảm giá</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.filter(d => getDiscountStatus(d) === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã sử dụng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discounts.reduce((total, d) => total + d.usedCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ sử dụng</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (discounts.reduce((total, d) => total + d.usedCount, 0) / 
                 discounts.reduce((total, d) => total + d.usageLimit, 0)) * 100
              )}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách mã giảm giá</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc mã giảm giá theo các tiêu chí khác nhau
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã hoặc mô tả..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="percentage">Phần trăm</SelectItem>
                <SelectItem value="fixed">Số tiền cố định</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
                <SelectItem value="exhausted">Đã hết lượt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Discounts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giảm giá</TableHead>
                  <TableHead>Loại & Giá trị</TableHead>
                  <TableHead>Thời gian áp dụng</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiscounts.map((discount) => (
                  <TableRow key={discount._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono font-medium text-sm bg-muted px-2 py-1 rounded inline-block">
                          {discount.code}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {discount.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {discount.discountType === "percentage" ? (
                          <Percent className="h-4 w-4 text-green-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-blue-600" />
                        )}
                        <div>
                          <div className="font-medium">
                            {discount.discountType === "percentage" 
                              ? `${discount.value}%` 
                              : formatCurrency(discount.value)
                            }
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {discountTypeLabels[discount.discountType]}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(discount.validFrom)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          đến {formatDate(discount.validUntil)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {discount.usedCount} / {discount.usageLimit}
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min((discount.usedCount / discount.usageLimit) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(discount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Mở menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditDiscount(discount)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDiscountAction("copy", discount._id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Sao chép mã
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDiscountAction("delete", discount._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDiscounts.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Không tìm thấy mã giảm giá nào</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount Modal */}
      <DiscountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        discount={editingDiscount}
        onSave={handleSaveDiscount}
      />
    </div>
  )
}