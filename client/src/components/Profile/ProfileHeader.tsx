"use client";

import { useState } from "react";

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

export default function ProfileHeader({
  user,
  onAvatarChange,
  isEditing
}: ProfileHeaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onAvatarChange(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 ${
              isEditing
                ? "cursor-pointer hover:border-blue-300 transition-colors"
                : ""
            } ${dragOver ? "border-blue-400 bg-blue-50" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <svg
                  className="w-8 h-8 text-white"
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
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
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
    </div>
  );
}
