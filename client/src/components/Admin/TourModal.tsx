"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar as CalendarIcon, Upload, X } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tour } from "@/services/tourService";
import { Destination, destinationService } from "@/services/destinationService";

interface TourFormData {
  title: string;
  description: string;
  destinationId: string;
  departureLocation: {
    name: string;
    code?: string;
    fullName?: string;
    region?: string;
  };
  itinerary: any;
  startDate: string;
  endDate: string;
  price: number;
  discount: number;
  pricingByAge?: {
    adult: number;
    child: number;
    infant: number;
  };
  seats: number;
  images: string[];
  isFeatured: boolean;
  category?: string;
  duration?: string;
  isActive: boolean;
}

interface TourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour?: Tour | null;
  onSave: (tour: Partial<Tour>) => void;
}

export function TourModal({
  open,
  onOpenChange,
  tour,
  onSave
}: TourModalProps) {
  const [formData, setFormData] = useState<TourFormData>({
    title: tour?.title || "",
    description: tour?.description || "",
    destinationId: tour?.destinationId || "",
    departureLocation: tour?.departureLocation || {
      name: "",
      code: "",
      fullName: "",
      region: ""
    },
    itinerary: tour?.itinerary || {},
    startDate: tour?.startDate
      ? new Date(tour.startDate).toISOString().split("T")[0]
      : "",
    endDate: tour?.endDate
      ? new Date(tour.endDate).toISOString().split("T")[0]
      : "",
    price: tour?.price || 0,
    discount: tour?.discount || 0,
    pricingByAge: tour?.pricingByAge || {
      adult: 0,
      child: 0,
      infant: 0
    },
    seats: tour?.seats || 0,
    images: tour?.images || [],
    isFeatured: tour?.isFeatured || false,
    category: tour?.category || "",
    duration: tour?.duration || "",
    isActive: tour?.isActive !== undefined ? tour.isActive : true
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");

  // Load destinations for select
  useEffect(() => {
    const loadDestinations = async () => {
      const response = await destinationService.getDestinations({
        limit: 100 // Load all destinations
      });
      if (response.success) {
        setDestinations(response.data.destinations);
      }
    };
    loadDestinations();
  }, []);

  // Load tour data when tour prop changes
  useEffect(() => {
    if (tour) {
      setFormData({
        title: tour.title || "",
        description: tour.description || "",
        destinationId: tour.destinationId || "",
        departureLocation: tour.departureLocation || {
          name: "",
          code: "",
          fullName: "",
          region: ""
        },
        itinerary: tour.itinerary || {},
        startDate: tour.startDate
          ? new Date(tour.startDate).toISOString().split("T")[0]
          : "",
        endDate: tour.endDate
          ? new Date(tour.endDate).toISOString().split("T")[0]
          : "",
        price: tour.price || 0,
        discount: tour.discount || 0,
        pricingByAge: tour.pricingByAge || {
          adult: 0,
          child: 0,
          infant: 0
        },
        seats: tour.seats || 0,
        images: tour.images || [],
        isFeatured: tour.isFeatured || false,
        category: tour.category || "",
        duration: tour.duration || "",
        isActive: tour.isActive !== undefined ? tour.isActive : true
      });
    } else {
      // Reset form for new tour
      setFormData({
        title: "",
        description: "",
        destinationId: "",
        departureLocation: {
          name: "",
          code: "",
          fullName: "",
          region: ""
        },
        itinerary: {},
        startDate: "",
        endDate: "",
        price: 0,
        discount: 0,
        pricingByAge: {
          adult: 0,
          child: 0,
          infant: 0
        },
        seats: 0,
        images: [],
        isFeatured: false,
        category: "",
        duration: "",
        isActive: true
      });
    }
    setErrors({});
  }, [tour]);

  const handleInputChange = (field: keyof TourFormData, value: any) => {
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

  const handleDepartureLocationChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      departureLocation: {
        ...prev.departureLocation,
        [field]: value
      }
    }));
  };

  const handlePricingChange = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      pricingByAge: {
        ...prev.pricingByAge!,
        [field]: value
      }
    }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && !formData.images.includes(imageUrl.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()]
      }));
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tên tour không được để trống";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả tour không được để trống";
    }

    if (!formData.duration || !formData.duration.trim()) {
      newErrors.duration = "Thời gian tour là bắt buộc";
    }

    if (!formData.destinationId) {
      newErrors.destinationId = "Vui lòng chọn điểm đến";
    }

    if (!formData.departureLocation.name.trim()) {
      newErrors.departureLocation = "Địa điểm khởi hành không được để trống";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Ngày khởi hành không được để trống";
    }

    if (!formData.endDate) {
      newErrors.endDate = "Ngày kết thúc không được để trống";
    }

    if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate >= formData.endDate
    ) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày khởi hành";
    }

    if (formData.price <= 0) {
      newErrors.price = "Giá tour phải lớn hơn 0";
    }

    if (formData.discount < 0 || formData.discount > 100) {
      newErrors.discount = "Giảm giá phải từ 0 đến 100%";
    }

    if (formData.seats <= 0) {
      newErrors.seats = "Số chỗ ngồi phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Calculate availableSeats if not set
      const tourData = {
        ...formData,
        availableSeats: formData.seats // Default to total seats
      };
      onSave(tourData);
      onOpenChange(false);
      handleReset();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    handleReset();
  };

  const handleReset = () => {
    if (tour) {
      setFormData({
        title: tour.title || "",
        description: tour.description || "",
        destinationId: tour.destinationId || "",
        departureLocation: tour.departureLocation || {
          name: "",
          code: "",
          fullName: "",
          region: ""
        },
        itinerary: tour.itinerary || {},
        startDate: tour.startDate
          ? new Date(tour.startDate).toISOString().split("T")[0]
          : "",
        endDate: tour.endDate
          ? new Date(tour.endDate).toISOString().split("T")[0]
          : "",
        price: tour.price || 0,
        discount: tour.discount || 0,
        pricingByAge: tour.pricingByAge || {
          adult: 0,
          child: 0,
          infant: 0
        },
        seats: tour.seats || 0,
        images: tour.images || [],
        isFeatured: tour.isFeatured || false,
        category: tour.category || "",
        duration: tour.duration || "",
        isActive: tour.isActive !== undefined ? tour.isActive : true
      });
    } else {
      setFormData({
        title: "",
        description: "",
        destinationId: "",
        departureLocation: {
          name: "",
          code: "",
          fullName: "",
          region: ""
        },
        itinerary: {},
        startDate: "",
        endDate: "",
        price: 0,
        discount: 0,
        pricingByAge: {
          adult: 0,
          child: 0,
          infant: 0
        },
        seats: 0,
        images: [],
        isFeatured: false,
        category: "",
        duration: "",
        isActive: true
      });
    }
    setErrors({});
    setImageUrl("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tour ? "Chỉnh sửa tour" : "Tạo tour mới"}</DialogTitle>
          <DialogDescription>
            {tour
              ? "Cập nhật thông tin tour du lịch."
              : "Tạo tour du lịch mới."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid gap-2">
            <Label htmlFor="title">Tên tour *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Nhập tên tour..."
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Nhập mô tả chi tiết về tour..."
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Thời gian tour *</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => handleInputChange("duration", e.target.value)}
              placeholder="VD: 3 ngày 2 đêm"
              className={errors.duration ? "border-red-500" : ""}
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="destinationId">Điểm đến *</Label>
              <Select
                value={formData.destinationId}
                onValueChange={(value) =>
                  handleInputChange("destinationId", value)
                }
              >
                <SelectTrigger
                  className={errors.destinationId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn điểm đến" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((destination) => (
                    <SelectItem key={destination._id} value={destination._id}>
                      {destination.name} - {destination.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.destinationId && (
                <p className="text-sm text-red-500">{errors.destinationId}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adventure">Phiêu lưu</SelectItem>
                  <SelectItem value="cultural">Văn hóa</SelectItem>
                  <SelectItem value="relaxation">Nghỉ dưỡng</SelectItem>
                  <SelectItem value="family">Gia đình</SelectItem>
                  <SelectItem value="luxury">Sang trọng</SelectItem>
                  <SelectItem value="budget">Tiết kiệm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Departure Location */}
          <div className="grid gap-2">
            <Label>Địa điểm khởi hành *</Label>
            <Input
              value={formData.departureLocation.name}
              onChange={(e) =>
                handleDepartureLocationChange("name", e.target.value)
              }
              placeholder="VD: Hà Nội, TP.HCM..."
              className={errors.departureLocation ? "border-red-500" : ""}
            />
            {errors.departureLocation && (
              <p className="text-sm text-red-500">{errors.departureLocation}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Ngày khởi hành *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                      errors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(new Date(formData.startDate), "dd/MM/yyyy", {
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
                      formData.startDate
                        ? new Date(formData.startDate)
                        : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      handleInputChange(
                        "startDate",
                        date.toISOString().split("T")[0]
                      )
                    }
                    initialFocus
                    locale={vi}
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Ngày kết thúc *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(new Date(formData.endDate), "dd/MM/yyyy", {
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
                      formData.endDate ? new Date(formData.endDate) : undefined
                    }
                    onSelect={(date) =>
                      date &&
                      handleInputChange(
                        "endDate",
                        date.toISOString().split("T")[0]
                      )
                    }
                    initialFocus
                    locale={vi}
                    disabled={(date) =>
                      formData.startDate
                        ? date < new Date(formData.startDate)
                        : false
                    }
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Giá tour (VNĐ) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange("price", Number(e.target.value))
                }
                placeholder="VD: 5000000"
                className={errors.price ? "border-red-500" : ""}
                min="1"
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
              {formData.price > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(formData.price)}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="discount">Giảm giá (%)</Label>
              <Input
                id="discount"
                type="number"
                value={formData.discount}
                onChange={(e) =>
                  handleInputChange("discount", Number(e.target.value))
                }
                placeholder="VD: 10"
                className={errors.discount ? "border-red-500" : ""}
                min="0"
                max="100"
              />
              {errors.discount && (
                <p className="text-sm text-red-500">{errors.discount}</p>
              )}
            </div>
          </div>

          {/* Seats */}
          <div className="grid gap-2">
            <Label htmlFor="seats">Số chỗ ngồi *</Label>
            <Input
              id="seats"
              type="number"
              value={formData.seats}
              onChange={(e) =>
                handleInputChange("seats", Number(e.target.value))
              }
              placeholder="VD: 20"
              className={errors.seats ? "border-red-500" : ""}
              min="1"
            />
            {errors.seats && (
              <p className="text-sm text-red-500">{errors.seats}</p>
            )}
          </div>

          {/* Images */}
          <div className="grid gap-2">
            <Label>Hình ảnh</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Nhập URL hình ảnh..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddImage} size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Thêm
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.images.map((image, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="truncate max-w-[100px]">{image}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveImage(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    isFeatured: checked as boolean
                  }))
                }
              />
              <Label htmlFor="isFeatured">Tour nổi bật</Label>
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
              <Label htmlFor="isActive">Kích hoạt tour</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button onClick={handleSave}>{tour ? "Cập nhật" : "Tạo mới"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
