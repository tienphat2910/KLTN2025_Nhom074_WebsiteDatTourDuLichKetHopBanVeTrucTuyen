"use client";

import { useState, useEffect } from "react";
import { Upload, X, Plus, Minus } from "lucide-react";

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
  const [detailItems, setDetailItems] = useState<number[]>([1]); // Start with only item 1

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

    if (!formData.price.retail.adult || formData.price.retail.adult <= 0) {
      toast.error("Vui lòng nhập giá vé người lớn");
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                  onValueChange={(value) =>
                    setFormData({ ...formData, destinationId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn điểm đến" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => (
                      <SelectItem key={dest._id} value={dest._id}>
                        {dest.name}
                      </SelectItem>
                    ))}
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
                <Label htmlFor="location-name">Tên địa điểm</Label>
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
                />
              </div>
              <div>
                <Label htmlFor="location-address">Địa chỉ</Label>
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
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Giá vé</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price-adult">Người lớn *</Label>
                <Input
                  id="price-adult"
                  type="number"
                  min="0"
                  value={formData.price.retail.adult}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          adult: Number(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="price-child">Trẻ em</Label>
                <Input
                  id="price-child"
                  type="number"
                  min="0"
                  value={formData.price.retail.child}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          child: Number(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-baby">Em bé</Label>
                <Input
                  id="price-baby"
                  type="number"
                  min="0"
                  value={formData.price.retail.baby}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          baby: Number(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-senior">Người cao tuổi</Label>
                <Input
                  id="price-senior"
                  type="number"
                  min="0"
                  value={formData.price.retail.senior}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          senior: Number(e.target.value)
                        }
                      }
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="price-locker">Tủ khóa</Label>
                <Input
                  id="price-locker"
                  type="number"
                  min="0"
                  value={formData.price.retail.locker}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: {
                        ...formData.price,
                        retail: {
                          ...formData.price.retail,
                          locker: Number(e.target.value)
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
                <Label htmlFor="hours-weekday">Thứ 2 - Thứ 7</Label>
                <Input
                  id="hours-weekday"
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
                />
              </div>
              <div>
                <Label htmlFor="hours-weekend">Chủ nhật & Lễ</Label>
                <Input
                  id="hours-weekend"
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
                />
              </div>
              <div>
                <Label htmlFor="hours-cutoff">Ngưng bán vé</Label>
                <Input
                  id="hours-cutoff"
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
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Nhập URL hình ảnh..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button type="button" onClick={addImage} size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {formData.gallery.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
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
