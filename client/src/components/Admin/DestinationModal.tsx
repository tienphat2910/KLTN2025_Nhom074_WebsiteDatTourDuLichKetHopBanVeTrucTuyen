"use client";

import { useState, useEffect, useRef } from "react";
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
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Destination,
  DestinationFormData,
  DestinationRegion
} from "@/types/destination";
import { destinationService } from "@/services/destinationService";
import { toast } from "sonner";

interface DestinationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destination?: Destination | null;
  onSave: (destination: DestinationFormData) => void;
}

export function DestinationModal({
  open,
  onOpenChange,
  destination,
  onSave
}: DestinationModalProps) {
  const [formData, setFormData] = useState<DestinationFormData>({
    name: "",
    description: "",
    image: "",
    popular: false,
    region: "Miền Bắc"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when destination changes or modal opens
  useEffect(() => {
    if (destination) {
      setFormData({
        name: destination.name || "",
        description: destination.description || "",
        image: destination.image || "",
        popular: destination.popular || false,
        region: destination.region || "Miền Bắc"
      });
      setImagePreview(destination.image || "");
    } else {
      // Reset form for new destination
      setFormData({
        name: "",
        description: "",
        image: "",
        popular: false,
        region: "Miền Bắc"
      });
      setImagePreview("");
    }
    setSelectedFile(null);
    setErrors({});
  }, [destination, open]);

  const handleInputChange = (
    field: keyof DestinationFormData,
    value: string | boolean
  ) => {
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước file không được vượt quá 5MB");
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear image URL error
      if (errors.image) {
        setErrors((prev) => ({
          ...prev,
          image: ""
        }));
      }
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const response = await destinationService.uploadDestinationImage(
        selectedFile
      );

      if (response.success && response.data) {
        setFormData((prev) => ({
          ...prev,
          image: response.data!.url
        }));
        setSelectedFile(null);
        toast.success("Upload ảnh thành công");
      } else {
        toast.error(response.message || "Upload ảnh thất bại");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Có lỗi xảy ra khi upload ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      image: ""
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên địa điểm không được để trống";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả không được để trống";
    }

    if (!formData.image.trim()) {
      newErrors.image = "Vui lòng upload ảnh cho địa điểm";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onOpenChange(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setErrors({});
    setSelectedFile(null);
    setImagePreview("");
    setIsUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {destination ? "Chỉnh sửa địa điểm" : "Thêm địa điểm mới"}
          </DialogTitle>
          <DialogDescription>
            {destination
              ? "Cập nhật thông tin địa điểm du lịch."
              : "Tạo địa điểm du lịch mới trong hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên địa điểm *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Nhập tên địa điểm"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="region">Vùng miền</Label>
            <Select
              value={formData.region}
              onValueChange={(value: DestinationRegion) =>
                handleInputChange("region", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vùng miền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Miền Bắc">Miền Bắc</SelectItem>
                <SelectItem value="Miền Trung">Miền Trung</SelectItem>
                <SelectItem value="Miền Nam">Miền Nam</SelectItem>
                <SelectItem value="Tây Nguyên">Tây Nguyên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Nhập mô tả về địa điểm"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Hình ảnh *</Label>
            <div className="space-y-4">
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* File Input */}
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedFile ? "Chọn ảnh khác" : "Chọn ảnh"}
                </Button>

                {selectedFile && (
                  <Button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang upload...
                      </>
                    ) : (
                      "Upload ảnh"
                    )}
                  </Button>
                )}
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Đã chọn: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}

              {/* Current Image URL (hidden input) */}
              <input type="hidden" value={formData.image} />
            </div>
            {errors.image && (
              <p className="text-sm text-red-500">{errors.image}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) =>
                handleInputChange("popular", checked as boolean)
              }
            />
            <Label htmlFor="popular" className="text-sm font-normal">
              Địa điểm phổ biến
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isUploading}>
            {destination ? "Cập nhật" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
