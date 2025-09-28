"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { tourService, Tour } from "@/services/tourService";
import { bookingTourService } from "@/services/bookingTourService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function BookingTourPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  const tourId = searchParams.get("tourId");
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Thông tin khách - Pre-fill with user data if available
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt tour!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Pre-fill user information
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (tourId) {
      tourService.getTourById(tourId).then((res) => {
        if (res.success) setTour(res.data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [tourId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt tour!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    if (!fullName || !phone || !email) {
      toast.error("Vui lòng nhập đầy đủ thông tin hành khách!");
      return;
    }

    if (!tour) {
      toast.error("Không tìm thấy thông tin tour.");
      return;
    }

    if (!tour.pricingByAge) {
      toast.error("Thiếu thông tin giá tour.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await bookingTourService.createBookingTour({
        tourId: tour._id,
        numAdults: adults,
        numChildren: children,
        numInfants: infants,
        priceByAge: tour.pricingByAge,
        subtotal:
          adults * tour.pricingByAge.adult +
          children * tour.pricingByAge.child +
          infants * tour.pricingByAge.infant,
        status: "pending",
        passenger: { fullName, phone, email, note }
      });

      if (res.success) {
        toast.success("Đặt tour thành công!");
        router.push("/profile/bookings"); // Redirect to user's bookings
      } else {
        if (res.requireAuth) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          );
        } else {
          toast.error(res.message || "Đặt tour thất bại!");
        }
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang tải thông tin tour...</div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Không tìm thấy tour.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg space-y-6"
      >
        <h2 className="text-2xl font-bold mb-4">Đặt Tour: {tour.title}</h2>

        {/* User info display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">
            Thông tin tài khoản
          </h3>
          <p className="text-sm text-blue-700">Đăng nhập với: {user?.email}</p>
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Họ tên hành khách *
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Số điện thoại *</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email *</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Ghi chú</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center font-semibold">
          <span>Số người lớn: {adults}</span>
          <span>Trẻ em: {children}</span>
          <span>Em bé: {infants}</span>
        </div>
        <div className="font-bold text-green-600 text-xl">
          Tổng tiền:{" "}
          {tour.pricingByAge
            ? (
                adults * tour.pricingByAge.adult +
                children * tour.pricingByAge.child +
                infants * tour.pricingByAge.infant
              ).toLocaleString("vi-VN")
            : 0}{" "}
          đ
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
        >
          {submitting ? "Đang đặt tour..." : "Xác nhận đặt tour"}
        </button>
      </form>
    </div>
  );
}
