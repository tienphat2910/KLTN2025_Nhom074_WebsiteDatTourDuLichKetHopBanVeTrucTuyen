"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { destinationService, Destination } from "@/services/destinationService";
import { tourService } from "@/services/tourService";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { env } from "@/config/env";

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
  itinerary: Record<string, { title: string; description: string }>;
  startDate: string;
  endDate: string;
  duration: string; // e.g., "3 ngày 2 đêm"
  price: number;
  discount: number;
  pricingByAge: {
    adult: number;
    child: number;
    infant: number;
  };
  seats: number;
  images: string[];
  isFeatured: boolean;
  category: string;
  isActive: boolean;
}

interface AddTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tour: Partial<TourFormData>) => void;
}

const DURATION_OPTIONS = [
  { value: "2N1Đ", label: "2 ngày 1 đêm", days: 2 },
  { value: "3N2Đ", label: "3 ngày 2 đêm", days: 3 },
  { value: "4N3Đ", label: "4 ngày 3 đêm", days: 4 },
  { value: "5N4Đ", label: "5 ngày 4 đêm", days: 5 },
  { value: "6N5Đ", label: "6 ngày 5 đêm", days: 6 },
  { value: "7N6Đ", label: "7 ngày 6 đêm", days: 7 }
];

const CATEGORY_OPTIONS = [
  { value: "adventure", label: "Mạo hiểm" },
  { value: "cultural", label: "Văn hóa" },
  { value: "relaxation", label: "Nghỉ dưỡng" },
  { value: "family", label: "Gia đình" },
  { value: "luxury", label: "Cao cấp" },
  { value: "budget", label: "Tiết kiệm" }
];

export function AddTourModal({
  open,
  onOpenChange,
  onSave
}: AddTourModalProps) {
  const [currentTab, setCurrentTab] = useState("basic");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [formData, setFormData] = useState<TourFormData>({
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
    duration: "",
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
    category: "family",
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Load destinations
  useEffect(() => {
    const loadDestinations = async () => {
      const response = await destinationService.getDestinations({
        limit: 100
      });
      if (response.success) {
        setDestinations(response.data.destinations);
      }
    };
    loadDestinations();
  }, []);

  // Calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const durationOption = DURATION_OPTIONS.find(
        (opt) => opt.value === formData.duration
      );
      if (durationOption) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationOption.days - 1);

        setFormData((prev) => ({
          ...prev,
          endDate: endDate.toISOString().split("T")[0]
        }));

        // Initialize itinerary days
        const itinerary: Record<
          string,
          { title: string; description: string }
        > = {};
        for (let i = 1; i <= durationOption.days; i++) {
          itinerary[`day${i}`] = {
            title: `Ngày ${i}: `,
            description: ""
          };
        }
        setFormData((prev) => ({
          ...prev,
          itinerary
        }));
      }
    }
  }, [formData.startDate, formData.duration]);

  const handleInputChange = (field: keyof TourFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));

    // Clear error
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
        ...prev.pricingByAge,
        [field]: value
      }
    }));
  };

  const handleItineraryChange = (
    day: string,
    field: "title" | "description",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      itinerary: {
        ...prev.itinerary,
        [day]: {
          ...prev.itinerary[day],
          [field]: value
        }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const filesArray = Array.from(files);

    // Validate all files
    const invalidFiles = filesArray.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      toast.error("Vui lòng chỉ chọn các file hình ảnh!");
      return;
    }

    // Validate file sizes (max 5MB each)
    const oversizedFiles = filesArray.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      toast.error(
        `${oversizedFiles.length} file vượt quá 5MB! Vui lòng chọn file nhỏ hơn.`
      );
      return;
    }

    setUploadingImage(true);
    setUploadProgress({ current: 0, total: filesArray.length });

    try {
      // Show uploading toast
      toast.info(`Đang tải lên ${filesArray.length} hình ảnh...`);

      // Upload all files with progress tracking
      const uploadedUrls: string[] = [];

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadProgress({ current: i + 1, total: filesArray.length });

        // Upload via tourService
        const result = await tourService.uploadTourImage(file, "temp");

        if (!result.success) {
          throw new Error(result.message || "Upload failed");
        }

        if (result.success && result.data?.url) {
          uploadedUrls.push(result.data.url);
        }
      }

      // Add all uploaded images to form
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast.success(`Tải lên ${uploadedUrls.length} hình ảnh thành công!`);

      // Reset input
      e.target.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error
          ? `Lỗi: ${error.message}`
          : "Lỗi khi tải ảnh lên. Vui lòng thử lại!"
      );
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const validateTab = (tab: string) => {
    const newErrors: Record<string, string> = {};

    switch (tab) {
      case "basic":
        if (!formData.title.trim()) {
          newErrors.title = "Tên tour không được để trống";
        }
        if (!formData.description.trim()) {
          newErrors.description = "Mô tả tour không được để trống";
        }
        if (!formData.departureLocation.name.trim()) {
          newErrors.departureLocation =
            "Địa điểm khởi hành không được để trống";
        }
        if (!formData.destinationId) {
          newErrors.destinationId = "Vui lòng chọn điểm đến";
        }
        break;

      case "schedule":
        if (!formData.startDate) {
          newErrors.startDate = "Ngày khởi hành không được để trống";
        }
        if (!formData.duration) {
          newErrors.duration = "Vui lòng chọn thời gian tour";
        }
        if (formData.price <= 0) {
          newErrors.price = "Giá tour phải lớn hơn 0";
        }
        if (formData.seats <= 0) {
          newErrors.seats = "Số chỗ phải lớn hơn 0";
        }
        break;

      case "itinerary":
        const days = Object.keys(formData.itinerary);
        const hasEmptyItinerary = days.some(
          (day) =>
            !formData.itinerary[day].title.trim() ||
            !formData.itinerary[day].description.trim()
        );
        if (hasEmptyItinerary) {
          newErrors.itinerary =
            "Vui lòng nhập đầy đủ lịch trình cho tất cả các ngày";
        }
        break;

      case "images":
        if (formData.images.length === 0) {
          newErrors.images = "Vui lòng thêm ít nhất 1 hình ảnh";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextTab = () => {
    const tabs = ["basic", "schedule", "itinerary", "images"];
    const currentIndex = tabs.indexOf(currentTab);

    if (validateTab(currentTab)) {
      if (currentIndex < tabs.length - 1) {
        setCurrentTab(tabs[currentIndex + 1]);
      }
    } else {
      toast.error("Vui lòng điền đầy đủ thông tin!");
    }
  };

  const handlePreviousTab = () => {
    const tabs = ["basic", "schedule", "itinerary", "images"];
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex > 0) {
      setCurrentTab(tabs[currentIndex - 1]);
    }
  };

  const handleSave = () => {
    // Validate all tabs
    const allTabsValid =
      validateTab("basic") &&
      validateTab("schedule") &&
      validateTab("itinerary") &&
      validateTab("images");

    if (allTabsValid) {
      // Clean up departureLocation - remove empty fields
      const cleanDepartureLocation: any = {
        name: formData.departureLocation.name
      };

      if (formData.departureLocation.code?.trim()) {
        cleanDepartureLocation.code = formData.departureLocation.code;
      }
      if (formData.departureLocation.fullName?.trim()) {
        cleanDepartureLocation.fullName = formData.departureLocation.fullName;
      }
      if (formData.departureLocation.region?.trim()) {
        cleanDepartureLocation.region = formData.departureLocation.region;
      }

      const tourData = {
        ...formData,
        departureLocation: cleanDepartureLocation,
        availableSeats: formData.seats
      };
      onSave(tourData);
      handleReset();
      onOpenChange(false);
    } else {
      toast.error("Vui lòng kiểm tra và điền đầy đủ thông tin!");
    }
  };

  const handleReset = () => {
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
      duration: "",
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
      category: "family",
      isActive: true
    });
    setErrors({});
    setImageUrl("");
    setCurrentTab("basic");
  };

  const getDurationDays = () => {
    const durationOption = DURATION_OPTIONS.find(
      (opt) => opt.value === formData.duration
    );
    return durationOption?.days || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo tour mới</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin để tạo tour du lịch mới
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="schedule">Lịch trình & Giá</TabsTrigger>
            <TabsTrigger value="itinerary">Chi tiết hành trình</TabsTrigger>
            <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Information */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tên tour *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="VD: Tour Phú Quốc 4N3Đ - Khám phá VinWonder..."
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả tour *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Nhập mô tả chi tiết về tour..."
                  className={errors.description ? "border-red-500" : ""}
                  rows={5}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="departureLocation">
                    Địa điểm khởi hành *
                  </Label>
                  <Input
                    id="departureLocation"
                    value={formData.departureLocation.name}
                    onChange={(e) =>
                      handleDepartureLocationChange("name", e.target.value)
                    }
                    placeholder="VD: TP. Hồ Chí Minh, Hà Nội..."
                    className={errors.departureLocation ? "border-red-500" : ""}
                  />
                  {errors.departureLocation && (
                    <p className="text-sm text-red-500">
                      {errors.departureLocation}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="region">Vùng miền</Label>
                  <Select
                    value={formData.departureLocation.region || ""}
                    onValueChange={(value) =>
                      handleDepartureLocationChange("region", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vùng miền (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                      <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                      <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                    {destinations.map((dest) => (
                      <SelectItem key={dest._id} value={dest._id}>
                        {dest.name} ({dest.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destinationId && (
                  <p className="text-sm text-red-500">{errors.destinationId}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Phân loại tour</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Schedule & Pricing */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Ngày khởi hành *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="duration">Thời gian tour *</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) =>
                      handleInputChange("duration", value)
                    }
                  >
                    <SelectTrigger
                      className={errors.duration ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.duration && (
                    <p className="text-sm text-red-500">{errors.duration}</p>
                  )}
                </div>
              </div>

              {formData.endDate && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Ngày kết thúc:</strong>{" "}
                    {new Date(formData.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}

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
                    placeholder="VD: 6989000"
                    className={errors.price ? "border-red-500" : ""}
                    min="0"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500">{errors.price}</p>
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
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Giá theo độ tuổi (VNĐ) *</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adultPrice" className="text-sm">
                      Người lớn
                    </Label>
                    <Input
                      id="adultPrice"
                      type="number"
                      value={formData.pricingByAge.adult}
                      onChange={(e) =>
                        handlePricingChange("adult", Number(e.target.value))
                      }
                      placeholder="6989000"
                      min="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="childPrice" className="text-sm">
                      Trẻ em
                    </Label>
                    <Input
                      id="childPrice"
                      type="number"
                      value={formData.pricingByAge.child}
                      onChange={(e) =>
                        handlePricingChange("child", Number(e.target.value))
                      }
                      placeholder="5990000"
                      min="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="infantPrice" className="text-sm">
                      Em bé
                    </Label>
                    <Input
                      id="infantPrice"
                      type="number"
                      value={formData.pricingByAge.infant}
                      onChange={(e) =>
                        handlePricingChange("infant", Number(e.target.value))
                      }
                      placeholder="3290000"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seats">Số chỗ *</Label>
                <Input
                  id="seats"
                  type="number"
                  value={formData.seats}
                  onChange={(e) =>
                    handleInputChange("seats", Number(e.target.value))
                  }
                  placeholder="VD: 30"
                  className={errors.seats ? "border-red-500" : ""}
                  min="1"
                />
                {errors.seats && (
                  <p className="text-sm text-red-500">{errors.seats}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    handleInputChange("isFeatured", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Đánh dấu là tour nổi bật
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Itinerary */}
          <TabsContent value="itinerary" className="space-y-4 mt-4">
            {getDurationDays() > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Nhập lịch trình chi tiết cho {getDurationDays()} ngày
                </p>

                {Object.keys(formData.itinerary)
                  .sort()
                  .map((day, index) => (
                    <Card key={day}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">
                            Ngày {index + 1}
                          </h4>

                          <div className="grid gap-2">
                            <Label htmlFor={`${day}-title`}>Tiêu đề *</Label>
                            <Input
                              id={`${day}-title`}
                              value={formData.itinerary[day].title}
                              onChange={(e) =>
                                handleItineraryChange(
                                  day,
                                  "title",
                                  e.target.value
                                )
                              }
                              placeholder="VD: Ngày 1: TP.HCM - PHÚ QUỐC (Ăn trưa, tối)"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`${day}-description`}>
                              Mô tả chi tiết *
                            </Label>
                            <Textarea
                              id={`${day}-description`}
                              value={formData.itinerary[day].description}
                              onChange={(e) =>
                                handleItineraryChange(
                                  day,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Nhập mô tả chi tiết cho ngày này..."
                              rows={4}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {errors.itinerary && (
                  <p className="text-sm text-red-500">{errors.itinerary}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Vui lòng chọn ngày khởi hành và thời gian tour ở tab trước
              </div>
            )}
          </TabsContent>

          {/* Tab 4: Images */}
          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Tải ảnh lên (có thể chọn nhiều file)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadProgress && (
                        <span className="text-sm text-muted-foreground">
                          {uploadProgress.current}/{uploadProgress.total}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {uploadProgress && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (uploadProgress.current / uploadProgress.total) * 100
                        }%`
                      }}
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Chọn nhiều ảnh cùng lúc hoặc nhập URL hình ảnh bên dưới
                  (Shift/Ctrl + Click để chọn nhiều)
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Nhập URL hình ảnh..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddImage();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddImage}>
                  Thêm
                </Button>
              </div>

              {errors.images && (
                <p className="text-sm text-red-500">{errors.images}</p>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Tour ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Chưa có hình ảnh nào. Vui lòng thêm ít nhất 1 hình ảnh.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            {currentTab !== "basic" && (
              <Button variant="outline" onClick={handlePreviousTab}>
                Quay lại
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>

            {currentTab !== "images" ? (
              <Button onClick={handleNextTab}>Tiếp theo</Button>
            ) : (
              <Button onClick={handleSave}>Tạo tour</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
