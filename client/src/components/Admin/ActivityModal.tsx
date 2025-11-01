"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  X,
  Plus,
  Minus,
  Image as ImageIcon,
  Loader2,
  Search
} from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Activity } from "@/types/activity";
import { Destination, destinationService } from "@/services/destinationService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

interface ActivityFormData {
  name: string;
  description: string;
  location: {
    name: string;
    address: string;
  };
  price: {
    retail: {
      adult: number;
      child: number;
      locker: number;
      baby: number;
      senior: number;
    };
    note: string;
  };
  operating_hours: {
    mon_to_sat: string;
    sunday_holidays: string;
    ticket_cutoff: string;
    rides_end: string;
  };
  features: string[];
  detail: {
    d1: string;
    d2: string;
    d3: string;
    d4: string;
    d5: string;
    d6: string;
    d7: string;
  };
  gallery: string[];
  popular: boolean;
  destinationId: string;
}

interface ActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: Activity | null;
  onSave: (activity: Partial<Activity>) => void;
}

export function ActivityModal({
  open,
  onOpenChange,
  activity,
  onSave
}: ActivityModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    name: activity?.name || "",
    description: activity?.description || "",
    location: {
      name: activity?.location?.name || "",
      address: activity?.location?.address || ""
    },
    price: {
      retail: {
        adult: activity?.price?.retail?.adult || 0,
        child: activity?.price?.retail?.child || 0,
        locker: activity?.price?.retail?.locker || 0,
        baby: activity?.price?.retail?.baby || 0,
        senior: activity?.price?.retail?.senior || 0
      },
      note: activity?.price?.note || ""
    },
    operating_hours: {
      mon_to_sat: activity?.operating_hours?.mon_to_sat || "",
      sunday_holidays: activity?.operating_hours?.sunday_holidays || "",
      ticket_cutoff: activity?.operating_hours?.ticket_cutoff || "",
      rides_end: activity?.operating_hours?.rides_end || ""
    },
    features: activity?.features || [],
    detail: {
      d1: activity?.detail?.d1 || "",
      d2: activity?.detail?.d2 || "",
      d3: activity?.detail?.d3 || "",
      d4: activity?.detail?.d4 || "",
      d5: activity?.detail?.d5 || "",
      d6: activity?.detail?.d6 || "",
      d7: activity?.detail?.d7 || ""
    },
    gallery: activity?.gallery || [],
    popular: activity?.popular || false,
    destinationId: activity?.destinationId || ""
  });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newFeature, setNewFeature] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [detailItems, setDetailItems] = useState<number[]>([1]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [destinationSearch, setDestinationSearch] = useState("");

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\D/g, "")) || 0;
  };

  // Time helper - convert "HH:mm" to string
  const formatTimeString = (time: string): string => {
    return time; // Already in "HH:mm" format
  };

  // Load destinations on mount
  useEffect(() => {
    loadDestinations();
  }, []);

  // Update form data when activity prop changes
  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || "",
        description: activity.description || "",
        location: {
          name: activity.location?.name || "",
          address: activity.location?.address || ""
        },
        price: {
          retail: {
            adult: activity.price?.retail?.adult || 0,
            child: activity.price?.retail?.child || 0,
            locker: activity.price?.retail?.locker || 0,
            baby: activity.price?.retail?.baby || 0,
            senior: activity.price?.retail?.senior || 0
          },
          note: activity.price?.note || ""
        },
        operating_hours: {
          mon_to_sat: activity.operating_hours?.mon_to_sat || "",
          sunday_holidays: activity.operating_hours?.sunday_holidays || "",
          ticket_cutoff: activity.operating_hours?.ticket_cutoff || "",
          rides_end: activity.operating_hours?.rides_end || ""
        },
        features: activity.features || [],
        detail: {
          d1: activity.detail?.d1 || "",
          d2: activity.detail?.d2 || "",
          d3: activity.detail?.d3 || "",
          d4: activity.detail?.d4 || "",
          d5: activity.detail?.d5 || "",
          d6: activity.detail?.d6 || "",
          d7: activity.detail?.d7 || ""
        },
        gallery: activity.gallery || [],
        popular: activity.popular || false,
        destinationId: activity.destinationId || ""
      });

      // Initialize detail items based on existing data
      const existingItems: number[] = [];
      const details = activity.detail;
      if (details) {
        if (details.d1?.trim()) existingItems.push(1);
        if (details.d2?.trim()) existingItems.push(2);
        if (details.d3?.trim()) existingItems.push(3);
        if (details.d4?.trim()) existingItems.push(4);
        if (details.d5?.trim()) existingItems.push(5);
        if (details.d6?.trim()) existingItems.push(6);
        if (details.d7?.trim()) existingItems.push(7);
      }
      // Always show at least item 1
      if (existingItems.length === 0) {
        existingItems.push(1);
      }
      setDetailItems(existingItems);
    } else {
      // Reset form for new activity
      setFormData({
        name: "",
        description: "",
        location: {
          name: "",
          address: ""
        },
        price: {
          retail: {
            adult: 0,
            child: 0,
            locker: 0,
            baby: 0,
            senior: 0
          },
          note: ""
        },
        operating_hours: {
          mon_to_sat: "",
          sunday_holidays: "",
          ticket_cutoff: "",
          rides_end: ""
        },
        features: [],
        detail: {
          d1: "",
          d2: "",
          d3: "",
          d4: "",
          d5: "",
          d6: "",
          d7: ""
        },
        gallery: [],
        popular: false,
        destinationId: ""
      });
      setDetailItems([1]); // Reset to only show item 1
    }
  }, [activity]);

  const loadDestinations = async () => {
    try {
      const response = await destinationService.getDestinations();
      if (response.success && response.data) {
        // Handle both array and object with destinations property
        const destinationsArray = Array.isArray(response.data)
          ? response.data
          : response.data.destinations || [];
        setDestinations(destinationsArray);
      }
    } catch (error) {
      console.error("Load destinations error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên hoạt động");
      return;
    }

    if (!formData.destinationId) {
      toast.error("Vui lòng chọn điểm đến");
      return;
    }

    if (!formData.location.name.trim() || !formData.location.address.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin địa điểm");
      return;
    }

    if (!formData.price.retail.adult || formData.price.retail.adult <= 0) {
      toast.error("Vui lòng nhập giá vé người lớn");
      return;
    }

    if (
      !formData.operating_hours.mon_to_sat.trim() ||
      !formData.operating_hours.sunday_holidays.trim()
    ) {
      toast.error("Vui lòng nhập giờ hoạt động");
      return;
    }

    setIsLoading(true);

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Save activity error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        gallery: [...prev.gallery, newImageUrl.trim()]
      }));
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    toast.info(`Đang tải ${files.length} ảnh lên Cloudinary...`);

    // Create preview URLs for uploading images
    const previewUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        previewUrls.push(previewUrl);
      }
    }

    // Add preview URLs to show loading state
    setUploadingImages(previewUrls);

    try {
      // Create FormData to upload files
      const uploadFormData = new FormData();
      let validFileCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`File ${file.name} không phải là hình ảnh`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File ${file.name} quá lớn (tối đa 5MB)`);
          continue;
        }

        uploadFormData.append("images", file);
        validFileCount++;
        console.log(`Added file ${i + 1}:`, file.name, file.type, file.size);
      }

      console.log(`Total valid files to upload: ${validFileCount}`);

      if (validFileCount === 0) {
        toast.error("Không có file hợp lệ để upload");
        setUploadingImages([]);
        return;
      }

      // Get activity ID or use 'new' for new activities
      const activityId = activity?._id || "new";
      uploadFormData.append("activityId", activityId);

      console.log(
        "Uploading to:",
        `${env.API_BASE_URL}/activities/upload-images`
      );
      console.log("Activity ID:", activityId);

      // Upload to server (which will upload to Cloudinary)
      const response = await fetch(
        `${env.API_BASE_URL}/activities/upload-images`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "lutrip_admin_token"
            )}`
          },
          body: uploadFormData
        }
      );

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (result.success && result.urls) {
        setFormData((prev) => ({
          ...prev,
          gallery: [...prev.gallery, ...result.urls]
        }));
        toast.success(`Đã thêm ${result.urls.length} hình ảnh từ Cloudinary`);

        // Cleanup preview URLs
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setUploadingImages([]);
      } else {
        toast.error(result.message || "Upload thất bại");
        setUploadingImages([]);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Lỗi khi upload hình ảnh");
      setUploadingImages([]);
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addDetailItem = () => {
    const nextItem = Math.max(...detailItems) + 1;
    if (nextItem <= 7) {
      setDetailItems((prev) => [...prev, nextItem]);
    }
  };

  const removeDetailItem = (itemNumber: number) => {
    if (detailItems.length > 1) {
      const sortedItems = detailItems.sort((a, b) => a - b);
      const remainingItems = sortedItems.filter((item) => item !== itemNumber);

      // Create new detail object with renumbered content
      const newDetail = { ...formData.detail };

      // Clear all detail fields first
      Object.keys(newDetail).forEach((key) => {
        newDetail[key as keyof typeof newDetail] = "";
      });

      // Copy content to consecutive positions starting from d1
      remainingItems.forEach((oldItemNumber, index) => {
        const newPosition = index + 1; // 1, 2, 3, etc.
        const oldKey = `d${oldItemNumber}` as keyof typeof formData.detail;
        const newKey = `d${newPosition}` as keyof typeof formData.detail;
        newDetail[newKey] = formData.detail[oldKey];
      });

      // Create new detailItems array with consecutive numbers
      const newDetailItems = Array.from(
        { length: remainingItems.length },
        (_, i) => i + 1
      );

      setFormData((prev) => ({
        ...prev,
        detail: newDetail
      }));

      setDetailItems(newDetailItems);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activity ? "Chỉnh sửa hoạt động" : "Tạo hoạt động mới"}
          </DialogTitle>
          <DialogDescription>
            {activity
              ? "Cập nhật thông tin hoạt động"
              : "Nhập thông tin cho hoạt động mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tên hoạt động *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ví dụ: Khu vui chơi Vinpearl Land"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả chi tiết về hoạt động..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destinationId">Điểm đến *</Label>
                <Select
                  value={formData.destinationId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, destinationId: value });
                    setDestinationSearch("");
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn điểm đến" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="sticky top-0 bg-white p-2 border-b z-10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Tìm điểm đến..."
                          className="h-9 pl-9"
                          value={destinationSearch}
                          onChange={(e) => setDestinationSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {destinations
                        .filter((dest) =>
                          destinationSearch === ""
                            ? true
                            : dest.name
                                .toLowerCase()
                                .includes(destinationSearch.toLowerCase())
                        )
                        .map((dest) => (
                          <SelectItem key={dest._id} value={dest._id}>
                            {dest.name}
                          </SelectItem>
                        ))}
                      {destinations.filter((dest) =>
                        destinationSearch === ""
                          ? true
                          : dest.name
                              .toLowerCase()
                              .includes(destinationSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">
                          Không tìm thấy điểm đến
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="popular"
                  checked={formData.popular}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, popular: checked as boolean })
                  }
                />
                <Label htmlFor="popular" className="cursor-pointer">
                  Hoạt động nổi bật
                </Label>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thông tin địa điểm</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location-name">
                  Tên địa điểm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location-name"
                  value={formData.location.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, name: e.target.value }
                    })
                  }
                  placeholder="Ví dụ: Vinpearl Land"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location-address">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location-address"
                  value={formData.location.address}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: {
                        ...formData.location,
                        address: e.target.value
                      }
                    })
                  }
                  placeholder="Số nhà, đường, quận/huyện"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Giá vé</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price-adult">
                  Người lớn (VNĐ) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price-adult"
                  type="text"
                  value={formatCurrency(formData.price.retail.adult)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          adult: parseCurrency(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price-child">Trẻ em (VNĐ)</Label>
                <Input
                  id="price-child"
                  type="text"
                  value={formatCurrency(formData.price.retail.child)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          child: parseCurrency(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-baby">Em bé (VNĐ)</Label>
                <Input
                  id="price-baby"
                  type="text"
                  value={formatCurrency(formData.price.retail.baby)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          baby: parseCurrency(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-senior">Người cao tuổi (VNĐ)</Label>
                <Input
                  id="price-senior"
                  type="text"
                  value={formatCurrency(formData.price.retail.senior)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          senior: parseCurrency(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-locker">Tủ khóa (VNĐ)</Label>
                <Input
                  id="price-locker"
                  type="text"
                  value={formatCurrency(formData.price.retail.locker)}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          locker: parseCurrency(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="price-note">Ghi chú giá</Label>
              <Textarea
                id="price-note"
                value={formData.price.note}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: { ...formData.price, note: e.target.value }
                  })
                }
                placeholder="Ví dụ: Giá đã bao gồm VAT, Trẻ em dưới 1m miễn phí..."
                rows={2}
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Giờ hoạt động</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours-weekday">
                  Thứ 2 - Thứ 7 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hours-weekday"
                  type="text"
                  value={formData.operating_hours.mon_to_sat}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        mon_to_sat: e.target.value
                      }
                    })
                  }
                  placeholder="Ví dụ: 08:00 - 18:00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours-weekend">
                  Chủ nhật & Lễ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hours-weekend"
                  type="text"
                  value={formData.operating_hours.sunday_holidays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        sunday_holidays: e.target.value
                      }
                    })
                  }
                  placeholder="Ví dụ: 08:00 - 20:00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours-cutoff">Ngưng bán vé</Label>
                <Input
                  id="hours-cutoff"
                  type="text"
                  value={formData.operating_hours.ticket_cutoff}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        ticket_cutoff: e.target.value
                      }
                    })
                  }
                  placeholder="Ví dụ: 17:00"
                />
              </div>
              <div>
                <Label htmlFor="hours-rides-end">Kết thúc trò chơi</Label>
                <Input
                  id="hours-rides-end"
                  type="text"
                  value={formData.operating_hours.rides_end}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      operating_hours: {
                        ...formData.operating_hours,
                        rides_end: e.target.value
                      }
                    })
                  }
                  placeholder="Ví dụ: 17:30"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              * Nhập theo định dạng: HH:mm hoặc HH:mm - HH:mm
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Đặc điểm nổi bật</h3>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Nhập đặc điểm..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chi tiết hoạt động</h3>
              {detailItems.length < 7 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDetailItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mục
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {detailItems
                .sort((a, b) => a - b)
                .map((itemNumber) => (
                  <div key={itemNumber} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor={`detail-d${itemNumber}`}>
                        Mục {itemNumber}
                      </Label>
                      {detailItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDetailItem(itemNumber)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id={`detail-d${itemNumber}`}
                      value={
                        formData.detail[
                          `d${itemNumber}` as keyof typeof formData.detail
                        ] || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          detail: {
                            ...formData.detail,
                            [`d${itemNumber}` as keyof typeof formData.detail]:
                              e.target.value
                          }
                        })
                      }
                      placeholder={`Nội dung chi tiết mục ${itemNumber}...`}
                      rows={2}
                    />
                  </div>
                ))}
            </div>
          </div>

          {/* Gallery */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hình ảnh</h3>

            {/* Upload buttons */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Hoặc nhập URL hình ảnh..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addImage}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  URL
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="whitespace-nowrap"
              >
                <Upload className="h-4 w-4 mr-2" />
                Tải ảnh lên
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>• Chọn nhiều ảnh cùng lúc (tối đa 5MB/ảnh)</p>
              <p>• Hỗ trợ: JPG, PNG, GIF, WebP</p>
              <p>• Ảnh sẽ tự động upload lên Cloudinary</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Existing uploaded images */}
              {formData.gallery.map((url, index) => (
                <div
                  key={`uploaded-${index}`}
                  className="relative group aspect-video"
                >
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/300x200?text=Error";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Uploading images preview */}
              {uploadingImages.map((previewUrl, index) => (
                <div
                  key={`uploading-${index}`}
                  className="relative aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-blue-400"
                >
                  <img
                    src={previewUrl}
                    alt={`Uploading ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg opacity-50"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                    <span className="text-xs text-blue-600 font-medium">
                      Đang tải lên...
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                    {formData.gallery.length + index + 1}
                  </div>
                </div>
              ))}

              {formData.gallery.length === 0 &&
                uploadingImages.length === 0 && (
                  <div className="col-span-2 md:col-span-4 flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Chưa có hình ảnh nào
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tải ảnh lên hoặc nhập URL
                    </p>
                  </div>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : activity ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
