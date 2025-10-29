"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/Profile/ProfileHeader";
import ProfileForm from "@/components/Profile/ProfileForm";
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
  const { user, isAuthenticated, login, isAuthLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<ProfileUser | null>(null);

  useEffect(() => {
    console.log("Profile useEffect:", {
      isAuthLoading,
      isAuthenticated,
      hasUser: !!user
    });

    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log("Auth still loading...");
      return;
    }

    // Only redirect if auth is done loading AND user is not authenticated
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      router.push("/login");
      return;
    }

    // Set user data
    if (user) {
      console.log("Setting profile data for user:", user.email);
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
  }, [isAuthLoading, isAuthenticated, user, router]);

  // Show loading only while auth is being checked
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  // Show loading if user data hasn't been set yet
  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (formData: Partial<ProfileUser>) => {
    setIsLoading(true);
    try {
      // Show loading toast
      const toastId = toast.loading("Đang cập nhật thông tin...");

      const result = await authService.updateProfile(formData);

      toast.dismiss(toastId);

      if (result.success && result.data) {
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

        // Update AuthContext with new data
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
        toast.success("Cập nhật thông tin thành công!", {
          description: "Thông tin cá nhân đã được cập nhật"
        });
      } else {
        // Check if it's an API not implemented error
        if (
          result.message?.includes("API endpoint chưa được triển khai") ||
          result.message?.includes("chưa tồn tại")
        ) {
          toast.error("Tính năng chưa sẵn sàng", {
            description:
              "API cập nhật thông tin đang được phát triển. Vui lòng thử lại sau."
          });
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi cập nhật thông tin");
        }
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Có lỗi xảy ra", {
        description: "Vui lòng kiểm tra kết nối mạng và thử lại"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      // Show immediate feedback
      const toastId = toast.loading("Đang tải ảnh lên...", {
        description: "Vui lòng đợi trong giây lát"
      });

      const result = await authService.uploadAvatar(formData);

      toast.dismiss(toastId);

      if (result.success && result.data) {
        // Handle different response structures
        const updatedUser = result.data.user || result.data;
        const avatarUrl = updatedUser?.avatar || result.data.avatar;

        if (avatarUrl) {
          setUserData((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));

          if (user) {
            const updatedAuthUser = {
              ...user,
              avatar: avatarUrl
            };
            login(updatedAuthUser, localStorage.getItem("lutrip_token") || "");
          }

          toast.success("Cập nhật ảnh đại diện thành công!", {
            description: "Ảnh đại diện của bạn đã được cập nhật"
          });
        } else {
          toast.error("Không thể cập nhật ảnh đại diện", {
            description: "Vui lòng thử lại sau"
          });
        }
      } else {
        // Check if it's an API not implemented error
        if (
          result.message?.includes("API upload avatar chưa được triển khai") ||
          result.message?.includes("chưa tồn tại")
        ) {
          toast.error("Tính năng chưa sẵn sàng", {
            description:
              "API upload ảnh đang được phát triển. Vui lòng thử lại sau."
          });
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi tải ảnh lên", {
            description: "Vui lòng kiểm tra file và thử lại"
          });
        }
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Có lỗi xảy ra", {
        description: "Vui lòng kiểm tra kết nối mạng và thử lại"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24">
        <ProfileHeader
          user={userData}
          onAvatarChange={handleAvatarChange}
          isEditing={isEditing}
        />

        {/* Thông tin cá nhân */}
        <div className="mt-8">
          {isEditing ? (
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
                  <p className="text-gray-900 font-medium">
                    {userData?.fullName}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{userData?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Số điện thoại
                  </label>
                  <p className="text-gray-900">
                    {userData?.phone || "Chưa cập nhật"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Vai trò
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      userData?.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {userData?.role === "admin"
                      ? "Quản trị viên"
                      : "Khách hàng"}
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Ngày tham gia
                  </label>
                  <p className="text-gray-900">
                    {userData?.joinDate
                      ? new Date(userData.joinDate).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          }
                        )
                      : "Không có thông tin"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
