"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  joinDate?: string;
}

interface ProfileHeaderProps {
  user: User;
  onAvatarChange: (file: File) => void;
  isEditing: boolean;
}

// Generate random avatar color based on user email/name
const getAvatarColor = (text: string) => {
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-amber-500"
  ];

  // Simple hash function to get consistent color for same user
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export default function ProfileHeader({
  user,
  onAvatarChange,
  isEditing
}: ProfileHeaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateAndUploadFile = (file: File) => {
    // Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (file.size > maxSize) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP");
      return;
    }

    setIsUploading(true);
    onAvatarChange(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndUploadFile(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      validateAndUploadFile(file);
    } else {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
    }
  };

  // Reset uploading state when not editing
  useEffect(() => {
    if (!isEditing) {
      setIsUploading(false);
    }
  }, [isEditing]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 mt-4">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 ${
              isEditing
                ? "cursor-pointer hover:border-blue-300 transition-colors"
                : ""
            } ${dragOver ? "border-blue-400 bg-blue-50" : ""} ${
              isUploading ? "opacity-75" : ""
            }`}
            onDragOver={(e) => {
              if (isEditing) {
                e.preventDefault();
                setDragOver(true);
              }
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={isEditing ? handleDrop : undefined}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement?.classList.add(
                    "fallback-avatar"
                  );
                }}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center ${getAvatarColor(
                  user.email
                )}`}
              >
                <span className="text-3xl font-bold text-white">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Upload Progress Indicator */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}

            {/* Edit Overlay */}
            {isEditing && !isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="text-center text-white">
                  <svg
                    className="w-8 h-8 mx-auto mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs">Chọn ảnh</span>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {isEditing && (
            <>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.fullName}
          </h1>
          <p className="text-gray-600 mb-2">{user.email}</p>
          {user.phone && (
            <p className="text-gray-600 mb-2 flex items-center justify-center md:justify-start gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {user.phone}
            </p>
          )}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                user.role === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {user.role === "admin" ? "Quản trị viên" : "Khách hàng"}
            </span>
            {user.joinDate && (
              <span className="text-sm text-gray-500">
                Tham gia từ{" "}
                {new Date(user.joinDate).toLocaleDateString("vi-VN")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upload Instructions */}
      {isEditing && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Hướng dẫn:</strong> Nhấp vào ảnh hoặc kéo thả file ảnh để
            cập nhật avatar. Chấp nhận định dạng JPG, PNG, WEBP và tối đa 5MB.
          </p>
        </div>
      )}
    </div>
  );
}
