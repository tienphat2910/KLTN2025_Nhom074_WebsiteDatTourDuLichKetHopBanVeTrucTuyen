"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Discount, DiscountFormData, DiscountType } from "@/types/discount";

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Discount | null;
  onSave: (discount: DiscountFormData) => void;
}

export function DiscountModal({
  open,
  onOpenChange,
  discount,
  onSave
}: DiscountModalProps) {
  const [formData, setFormData] = useState<DiscountFormData>({
    code: discount?.code || "",
    description: discount?.description || "",
    discountType: discount?.discountType || "percentage",
    value: discount?.value || 0,
    validFrom: discount?.validFrom
      ? new Date(discount.validFrom).toISOString().split("T")[0]
      : "",
    validUntil: discount?.validUntil
      ? new Date(discount.validUntil).toISOString().split("T")[0]
      : "",
    usageLimit: discount?.usageLimit || 100,
    isActive: discount?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load discount data when discount prop changes
  useEffect(() => {
    if (discount) {
      setFormData({
        code: discount.code || "",
        description: discount.description || "",
        discountType: discount.discountType || "percentage",
        value: discount.value || 0,
        validFrom: discount.validFrom
          ? new Date(discount.validFrom).toISOString().split("T")[0]
          : "",
        validUntil: discount.validUntil
          ? new Date(discount.validUntil).toISOString().split("T")[0]
          : "",
        usageLimit: discount.usageLimit || 100,
        isActive: discount.isActive ?? true
      });
    } else {
      // Reset form for new discount
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        value: 0,
        validFrom: "",
        validUntil: "",
        usageLimit: 100,
        isActive: true
      });
    }
    setErrors({});
  }, [discount]);

  const handleInputChange = (field: keyof DiscountFormData, value: any) => {
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

    if (!formData.code.trim()) {
      newErrors.code = "Mã giảm giá không được để trống";
    } else if (formData.code.length < 3) {
      newErrors.code = "Mã giảm giá phải có ít nhất 3 ký tự";
    } else if (!/^[A-Z0-9]+$/.test(formData.code)) {
      newErrors.code = "Mã giảm giá chỉ được chứa chữ hoa và số";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }

    if (formData.value <= 0) {
      newErrors.value = "Giá trị giảm giá phải lớn hơn 0";
    } else if (formData.discountType === "percentage" && formData.value > 100) {
      newErrors.value = "Giá trị phần trăm không được vượt quá 100%";
    }

    if (!formData.validFrom) {
      newErrors.validFrom = "Ngày bắt đầu không được để trống";
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "Ngày kết thúc không được để trống";
    }

    if (
      formData.validFrom &&
      formData.validUntil &&
      formData.validFrom >= formData.validUntil
    ) {
      newErrors.validUntil = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    if (formData.usageLimit <= 0) {
      newErrors.usageLimit = "Giới hạn sử dụng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
      handleReset();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    handleReset();
  };

  const handleReset = () => {
    if (discount) {
      setFormData({
        code: discount.code || "",
        description: discount.description || "",
        discountType: discount.discountType || "percentage",
        value: discount.value || 0,
        validFrom: discount.validFrom
          ? new Date(discount.validFrom).toISOString().split("T")[0]
          : "",
        validUntil: discount.validUntil
          ? new Date(discount.validUntil).toISOString().split("T")[0]
          : "",
        usageLimit: discount.usageLimit || 100,
        isActive: discount.isActive ?? true
      });
    } else {
      setFormData({
        code: "",
        description: "",
        discountType: "percentage",
        value: 0,
        validFrom: "",
        validUntil: "",
        usageLimit: 100,
        isActive: true
      });
    }
    setErrors({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {discount ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}
          </DialogTitle>
          <DialogDescription>
            {discount
              ? "Cập nhật thông tin mã giảm giá."
              : "Tạo mã giảm giá mới cho khách hàng."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Mã giảm giá *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                handleInputChange("code", e.target.value.toUpperCase())
              }
              placeholder="VD: SUMMER2024"
              className={errors.code ? "border-red-500" : ""}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Chỉ sử dụng chữ hoa và số, ít nhất 3 ký tự
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Nhập mô tả cho mã giảm giá..."
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="discountType">Loại giảm giá *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: DiscountType) =>
                  handleInputChange("discountType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại giảm giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value">
                Giá trị *{" "}
                {formData.discountType === "percentage" ? "(%)" : "(VNĐ)"}
              </Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) =>
                  handleInputChange("value", Number(e.target.value))
                }
                placeholder={
                  formData.discountType === "percentage"
                    ? "VD: 20"
                    : "VD: 50000"
                }
                className={errors.value ? "border-red-500" : ""}
                min="1"
                max={formData.discountType === "percentage" ? "100" : undefined}
              />
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value}</p>
              )}
              {formData.discountType === "fixed" && formData.value > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(formData.value)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Ngày bắt đầu *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validFrom ? (
                      format(new Date(formData.validFrom), "dd/MM/yyyy", {
                        locale: vi
                      })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.validFrom
                        ? new Date(formData.validFrom)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      handleInputChange(
                        "validFrom",
                        date.toISOString().split("T")[0]
                      )
                    }
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Ngày kết thúc *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.validUntil && "text-muted-foreground",
                      errors.validUntil && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validUntil ? (
                      format(new Date(formData.validUntil), "dd/MM/yyyy", {
                        locale: vi
                      })
                    ) : (
                      <span>Chọn ngày</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.validUntil
                        ? new Date(formData.validUntil)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      handleInputChange(
                        "validUntil",
                        date.toISOString().split("T")[0]
                      )
                    }
                    initialFocus
                    locale={vi}
                    disabled={(date) =>
                      formData.validFrom
                        ? date < new Date(formData.validFrom)
                        : false
                    }
                  />
                </PopoverContent>
              </Popover>
              {errors.validUntil && (
                <p className="text-sm text-red-500">{errors.validUntil}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="usageLimit">Giới hạn sử dụng *</Label>
            <Input
              id="usageLimit"
              type="number"
              value={formData.usageLimit}
              onChange={(e) =>
                handleInputChange("usageLimit", Number(e.target.value))
              }
              placeholder="VD: 100"
              className={errors.usageLimit ? "border-red-500" : ""}
              min="1"
            />
            {errors.usageLimit && (
              <p className="text-sm text-red-500">{errors.usageLimit}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Số lần tối đa mã giảm giá có thể được sử dụng
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: checked as boolean
                }))
              }
            />
            <Label htmlFor="isActive">Kích hoạt mã giảm giá</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button onClick={handleSave}>
            {discount ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
