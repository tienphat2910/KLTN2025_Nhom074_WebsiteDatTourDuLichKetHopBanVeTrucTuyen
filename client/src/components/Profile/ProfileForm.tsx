"use client";

import { useState } from "react";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface ProfileFormProps {
  user: User;
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProfileForm({
  user,
  onSave,
  onCancel,
  isLoading = false
}: ProfileFormProps) {
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    phone: user.phone || ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Chỉnh sửa thông tin
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Nhập số điện thoại"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
