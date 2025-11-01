"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { env } from "@/config/env";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface AirlineModalProps {
  airline?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AirlineModal({
  airline,
  onClose,
  onSuccess
}: AirlineModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: airline?.name || "",
    code: airline?.code || "",
    logo: airline?.logo || "",
    description: airline?.description || "",
    isActive: airline?.isActive !== undefined ? airline.isActive : true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const url = airline
        ? `${env.API_BASE_URL}/airlines/${airline._id}`
        : `${env.API_BASE_URL}/airlines`;

      const response = await fetch(url, {
        method: airline ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          airline ? "Cập nhật hãng bay thành công" : "Thêm hãng bay thành công"
        );
        onSuccess();
      } else {
        toast.error(data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      toast.error("Lỗi khi lưu hãng bay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {airline ? "Chỉnh sửa hãng bay" : "Thêm hãng bay mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên hãng bay <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Vietnam Airlines"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Mã hãng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase()
                  })
                }
                placeholder="VD: VN"
                required
                disabled={!!airline}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">URL Logo</Label>
            <Input
              id="logo"
              type="url"
              value={formData.logo}
              onChange={(e) =>
                setFormData({ ...formData, logo: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả về hãng hàng không..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="isActive">Trạng thái</Label>
            <Select
              value={formData.isActive.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, isActive: value === "true" })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {loading ? "Đang lưu..." : airline ? "Cập nhật" : "Thêm mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
