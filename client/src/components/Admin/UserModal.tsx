"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { User, CreateUserData } from "@/services/userService";
import { Eye, EyeOff } from "lucide-react";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (
    user: CreateUserData | Partial<Pick<User, "fullName" | "role" | "status">>
  ) => void;
}

export function UserModal({
  open,
  onOpenChange,
  user,
  onSave
}: UserModalProps) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    password: "",
    fullName: "",
    role: "staff",
    status: "active"
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when user changes or modal opens
  useEffect(() => {
    if (user) {
      // Editing existing user - only allow editing fullName, role, status
      setFormData({
        email: user.email,
        password: "",
        fullName: user.fullName,
        role: user.role as "admin" | "staff",
        status: user.status as "active" | "inactive"
      });
    } else {
      // Creating new user
      setFormData({
        email: "",
        password: "",
        fullName: "",
        role: "staff",
        status: "active"
      });
    }
  }, [user, open]);

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation (only for new users)
    if (!user) {
      if (!formData.email.trim()) {
        newErrors.email = "Email không được để trống";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email không hợp lệ";
      }

      // Password validation (only for new users)
      if (!formData.password) {
        newErrors.password = "Mật khẩu không được để trống";
      } else if (formData.password.length <= 6) {
        newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      }
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Họ tên không được để trống";
    }

    // Role validation
    if (user) {
      // When editing, allow user, admin, staff
      if (!["user", "admin", "staff"].includes(formData.role)) {
        newErrors.role = "Vai trò không hợp lệ";
      }
    } else {
      // When creating, only allow admin, staff
      if (!["admin", "staff"].includes(formData.role)) {
        newErrors.role = "Vai trò phải là admin hoặc staff";
      }
    }

    // Status validation
    if (!["active", "inactive"].includes(formData.status)) {
      newErrors.status = "Trạng thái phải là active hoặc inactive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (user) {
        // Update existing user - only send allowed fields
        const updateData = {
          fullName: formData.fullName,
          role: formData.role,
          status: formData.status
        };
        await onSave(updateData);
      } else {
        // Create new user
        await onSave(formData);
      }
      onOpenChange(false);
      setErrors({});
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Cập nhật thông tin người dùng trong hệ thống."
              : "Tạo tài khoản admin/staff mới trong hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Email field - only for new users */}
          {!user && (
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Nhập email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          )}

          {/* Password field - only for new users */}
          {!user && (
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          )}

          {/* Full Name field */}
          <div className="grid gap-2">
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              placeholder="Nhập họ và tên"
              className={errors.fullName ? "border-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName}</p>
            )}
          </div>

          {/* Role field */}
          <div className="grid gap-2">
            <Label htmlFor="role">Vai trò *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "admin" | "staff") =>
                handleInputChange("role", value)
              }
            >
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {!user && <SelectItem value="staff">Nhân viên</SelectItem>}
                {!user && <SelectItem value="admin">Quản trị viên</SelectItem>}
                {user && <SelectItem value="user">Người dùng</SelectItem>}
                {user && <SelectItem value="staff">Nhân viên</SelectItem>}
                {user && <SelectItem value="admin">Quản trị viên</SelectItem>}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          {/* Status field */}
          <div className="grid gap-2">
            <Label htmlFor="status">Trạng thái *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") =>
                handleInputChange("status", value)
              }
            >
              <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          {/* Display email for existing users */}
          {user && (
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-gray-50" />
              <p className="text-xs text-gray-500">Email không thể chỉnh sửa</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : user ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
