export type UserRole = "user" | "admin"
export type UserStatus = "active" | "inactive" | "banned"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  role: UserRole
  status: UserStatus
  createdAt: string
  lastLogin: string
  totalBookings: number
  totalSpent: number
}

export interface UserFormData {
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
}