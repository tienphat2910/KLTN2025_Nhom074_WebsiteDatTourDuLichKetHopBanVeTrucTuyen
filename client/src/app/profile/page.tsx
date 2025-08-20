"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileForm from "@/components/Profile/ProfileForm";
import ProfileTabs from "@/components/Profile/ProfileTabs";
import { authService } from "@/services/authService";

interface ProfileUser {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: string;
  joinDate?: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [userData, setUserData] = useState<ProfileUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      // Convert AuthContext User to ProfileUser
      const profileUser: ProfileUser = {
        _id: user._id || user.id || "",
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        role: user.role,
        joinDate: user.createdAt || user.updatedAt
      };
      setUserData(profileUser);
    }
  }, [isAuthenticated, user, router]);

  const handleSaveProfile = async (formData: Partial<ProfileUser>) => {
    setIsLoading(true);
    try {
      const result = await authService.updateProfile(formData);

      if (result.success && result.data) {
        // Access user data correctly from result.data.user
        const updatedUser = result.data.user || result.data;

        const updatedProfileUser: ProfileUser = {
          _id: updatedUser._id || userData?._id || "",
          fullName:
            updatedUser.fullName ||
            formData.fullName ||
            userData?.fullName ||
            "",
          email: updatedUser.email || userData?.email || "",
          avatar: updatedUser.avatar || userData?.avatar,
          phone: updatedUser.phone || formData.phone,
          role: updatedUser.role || userData?.role,
          joinDate: updatedUser.createdAt || userData?.joinDate
        };

        setUserData(updatedProfileUser);

        // Update AuthContext with new data - ensure required fields are present
        if (user && (updatedUser.email || userData?.email)) {
          const authUser = {
            ...user,
            ...updatedUser,
            _id: updatedUser._id || user?._id || user?.id,
            email: updatedUser.email || userData?.email || user.email,
            fullName:
              updatedUser.fullName || userData?.fullName || user.fullName
          };
          login(authUser, localStorage.getItem("lutrip_token") || "");
        }

        setIsEditing(false);
        toast.success("Cập nhật thông tin thành công!");
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi cập nhật thông tin");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await authService.uploadAvatar(formData);

      if (result.success && result.data) {
        // The API response structure is { user: any, token: string }
        // So avatar should be in result.data.user.avatar
        const updatedUser = result.data.user;
        const avatarUrl = updatedUser?.avatar;

        if (avatarUrl) {
          setUserData((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));

          if (user) {
            const updatedAuthUser = {
              ...user,
              avatar: avatarUrl
            };
            login(updatedAuthUser, localStorage.getItem("lutrip_token") || "");
          }

          toast.success("Cập nhật ảnh đại diện thành công!");
        } else {
          toast.error("Không thể cập nhật ảnh đại diện");
        }
      } else {
        toast.error(result.message || "Có lỗi xảy ra khi tải ảnh lên");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return isEditing ? (
          <ProfileForm
            user={userData}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditing(false)}
            isLoading={isLoading}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Thông tin cá nhân
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
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
                Chỉnh sửa thông tin
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Họ và tên
                </label>
                <p className="text-gray-900 font-medium">{userData.fullName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{userData.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Số điện thoại
                </label>
                <p className="text-gray-900">
                  {userData.phone || "Chưa cập nhật"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Vai trò
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    userData.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {userData.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Ngày tham gia
                </label>
                <p className="text-gray-900">
                  {userData.joinDate
                    ? new Date(userData.joinDate).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })
                    : "Không có thông tin"}
                </p>
              </div>
            </div>
          </div>
        );

      case "bookings":
        return (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Đặt chỗ của tôi
            </h2>
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600">Bạn chưa có đặt chỗ nào</p>
            </div>
          </div>
        );

      case "favorites":
        return (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Yêu thích</h2>
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className="text-gray-600">Bạn chưa có mục yêu thích nào</p>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Bảo mật tài khoản
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Đổi mật khẩu</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Cập nhật mật khẩu để bảo vệ tài khoản
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <ProfileHeader
          user={userData}
          onAvatarChange={handleAvatarChange}
          isEditing={isEditing}
        />

        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {renderTabContent()}
      </div>

      <Footer />
    </div>
  );
}
