"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { env } from "@/config/env";
import {
  MapPin,
  Clock,
  Users,
  Calendar,
  DollarSign,
  Info,
  Tag,
  Ticket
} from "lucide-react";

function formatVND(amount: number) {
  return amount?.toLocaleString("vi-VN") + "đ";
}

export default function ActivityDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [babyCount, setBabyCount] = useState(0);
  const [seniorCount, setSeniorCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!slug) return;
    axios
      .get(`${env.API_BASE_URL}/activities/slug/${slug}`)
      .then((res) => {
        if (res.data.success) setActivity(res.data.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const getPrice = (type: "adult" | "child" | "baby" | "senior") => {
    if (!activity?.price?.retail) return 0;
    if (type === "adult") return activity.price.retail.adult || 0;
    if (type === "child") return activity.price.retail.child || 0;
    if (type === "baby") return activity.price.retail.baby || 0;
    if (type === "senior") return activity.price.retail.senior || 0;
    return 0;
  };

  const totalPrice =
    getPrice("adult") * adultCount +
    getPrice("child") * childCount +
    getPrice("baby") * babyCount +
    getPrice("senior") * seniorCount;

  const handleBooking = () => {
    if (!selectedDate) {
      alert("Vui lòng chọn ngày tham gia!");
      return;
    }

    if (!activity?._id) {
      alert("Không tìm thấy thông tin hoạt động!");
      return;
    }

    // Construct booking URL with parameters
    const params = new URLSearchParams({
      activityId: activity._id,
      adults: adultCount.toString(),
      children: childCount.toString(),
      babies: babyCount.toString(),
      seniors: seniorCount.toString(),
      date: selectedDate
    });

    router.push(`/bookingactivity?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-orange-600 font-bold text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-red-600 font-bold text-xl">
          Không tìm thấy hoạt động
        </div>
      </div>
    );
  }

  // Tách detail thành mảng ngày
  const detailDays = Object.values(activity.detail || {}).filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />

      {/* Breadcrumb */}
      <div className="pt-24 pb-2">
        <div className="container mx-auto px-4">
          <nav className="text-xs md:text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
            <a href="/" className="hover:text-orange-600">
              Trang chủ
            </a>
            <span className="mx-2">›</span>
            <a href="/destinations" className="hover:text-orange-600">
              VIỆT NAM
            </a>
            <span className="mx-2">›</span>
            <a href="/activity" className="hover:text-orange-600">
              Hoạt động
            </a>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">{activity.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg overflow-hidden mb-6 md:mb-8">
              <div className="relative h-56 sm:h-64 md:h-80 lg:h-96">
                <div
                  className="w-full h-full bg-cover bg-center cursor-pointer"
                  style={{
                    backgroundImage: `url('${
                      activity.gallery?.[selectedImageIndex] ||
                      "/images/banner-entertainment.webp"
                    }')`
                  }}
                  onClick={() => setShowGallery(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {/* Gallery Controls */}
                <button
                  onClick={() => setShowGallery(true)}
                  className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-black/70 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Xem ảnh ({activity.gallery?.length || 0})
                  </span>
                </button>
                {/* Image indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {(activity.gallery as string[]).map(
                    (_: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(idx);
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === selectedImageIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    )
                  )}
                </div>
              </div>
              {/* Thumbnail strip */}
              {activity.gallery && activity.gallery.length > 1 && (
                <div className="p-3 md:p-4 border-t border-gray-200">
                  <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 snap-x">
                    {activity.gallery
                      .slice(0, 8)
                      .map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`flex-shrink-0 w-14 h-10 md:w-16 md:h-12 rounded-lg overflow-hidden border-2 transition-colors snap-start ${
                            idx === selectedImageIndex
                              ? "border-orange-500"
                              : "border-gray-200"
                          }`}
                        >
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${img}')` }}
                          />
                        </button>
                      ))}
                    {activity.gallery.length > 8 && (
                      <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{activity.gallery.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-orange-700 mb-3">
                {activity.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-4">
                <div className="flex items-center bg-orange-50 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4 mr-1 text-orange-600" />
                  <span className="font-medium">Địa điểm:</span>
                  <span className="ml-1 text-orange-700">
                    {activity.location?.name || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  <span>
                    Địa chỉ: {activity.location?.address || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>
                    Giờ mở cửa: {activity.operating_hours?.mon_to_sat || "?"}{" "}
                    (T2-T7), {activity.operating_hours?.sunday_holidays || "?"}{" "}
                    (CN/Lễ)
                  </span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                {activity.description}
              </p>

              {activity.operating_hours && (
                <div className="mb-4">
                  <h4 className="font-semibold text-orange-700 mb-2">
                    Giờ hoạt động
                  </h4>
                  <ul className="text-sm text-gray-700">
                    <li>
                      Thứ 2 - Thứ 7: {activity.operating_hours.mon_to_sat}
                    </li>
                    <li>
                      Chủ nhật & lễ: {activity.operating_hours.sunday_holidays}
                    </li>
                    <li>
                      Ngưng bán vé: {activity.operating_hours.ticket_cutoff}
                    </li>
                    <li>
                      Kết thúc trò chơi: {activity.operating_hours.rides_end}
                    </li>
                  </ul>
                </div>
              )}
              {activity.features && activity.features.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-orange-700 mb-2">
                    Điểm nổi bật
                  </h4>
                  <ul className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activity.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-orange-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Chi tiết hoạt động (theo ngày/section) */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-orange-700 mb-4">
                Chi tiết hoạt động
              </h3>
              {detailDays.length > 0 ? (
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  {detailDays.map((desc, idx) => (
                    <li key={idx}>{String(desc)}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="flex justify-center mb-4">
                    <Info className="w-16 h-16 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">
                    Chi tiết hoạt động đang được cập nhật
                  </h4>
                  <p className="text-sm">
                    Thông tin chi tiết sẽ được cập nhật sớm nhất.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Đặt vé */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl md:text-3xl font-bold text-orange-600">
                    {activity.price?.retail?.adult
                      ? formatVND(activity.price.retail.adult)
                      : "Liên hệ"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm">Giá/người lớn</p>
                {/* Số lượng người */}
                <div className="mt-4 mb-4 space-y-3">
                  {/* Chọn ngày */}
                  <div className="mb-4">
                    <label className="block font-medium text-gray-700 mb-2 text-left">
                      Chọn ngày tham gia
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="min-w-[110px]">
                      <span className="font-medium text-gray-700 block text-left">
                        Người lớn
                      </span>
                      <span className="block text-base text-gray-600 text-left mt-1">
                        {formatVND(getPrice("adult"))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() =>
                          setAdultCount(Math.max(1, adultCount - 1))
                        }
                        disabled={adultCount <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-orange-200 text-orange-700">
                        {adultCount}
                      </span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() => setAdultCount(adultCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-[110px]">
                      <span className="font-medium text-gray-700 block text-left">
                        Trẻ em
                      </span>
                      <span className="block text-base text-gray-600 text-left mt-1">
                        {formatVND(getPrice("child"))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() =>
                          setChildCount(Math.max(0, childCount - 1))
                        }
                        disabled={childCount <= 0}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-orange-200 text-orange-700">
                        {childCount}
                      </span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() => setChildCount(childCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-[110px]">
                      <span className="font-medium text-gray-700 block text-left">
                        Em bé
                      </span>
                      <span className="block text-base text-gray-600 text-left mt-1">
                        {formatVND(getPrice("baby"))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() => setBabyCount(Math.max(0, babyCount - 1))}
                        disabled={babyCount <= 0}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-orange-200 text-orange-700">
                        {babyCount}
                      </span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() => setBabyCount(babyCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-[110px]">
                      <span className="font-medium text-gray-700 block text-left">
                        Người cao tuổi
                      </span>
                      <span className="block text-base text-gray-600 text-left mt-1">
                        {formatVND(getPrice("senior"))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() =>
                          setSeniorCount(Math.max(0, seniorCount - 1))
                        }
                        disabled={seniorCount <= 0}
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-medium bg-white rounded-md px-2 py-1 border border-orange-200 text-orange-700">
                        {seniorCount}
                      </span>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-white border border-orange-300 flex items-center justify-center text-orange-600 hover:bg-orange-50 transition"
                        onClick={() => setSeniorCount(seniorCount + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                {/* Tổng cộng */}
                <div className="mb-4 mt-2 p-3 rounded-lg bg-orange-50 border-l-4 border-orange-400 text-orange-700 text-base font-bold shadow-sm flex justify-between items-center">
                  <span>Tổng cộng</span>
                  <span>{formatVND(totalPrice)}</span>
                </div>
                {/* Note đẹp mắt */}
                {activity.price?.note && (
                  <div className="mt-3 mb-2 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-400 text-orange-700 text-sm font-medium shadow-sm">
                    <svg
                      className="inline-block w-5 h-5 mr-2 text-orange-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                    {activity.price.note}
                  </div>
                )}
              </div>
              <button
                onClick={handleBooking}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-base"
              >
                Đặt vé ngay
              </button>
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <h5 className="font-semibold text-gray-800 mb-2">
                  Cần hỗ trợ?
                </h5>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
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
                    <a href="tel:081820319" className="hover:text-orange-600">
                      Hotline: 081 820 319
                    </a>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:info@lutrip.com"
                      className="hover:text-orange-600"
                    >
                      Email: info@lutrip.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showGallery && activity.gallery && activity.gallery.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
            aria-label="Close gallery"
          >
            <svg
              className="w-6 h-6 md:w-8 md:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {activity.gallery.length > 1 && (
            <>
              <button
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? activity.gallery.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
                aria-label="Previous image"
              >
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={() =>
                  setSelectedImageIndex(
                    (prev) => (prev + 1) % activity.gallery.length
                  )
                }
                className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
                aria-label="Next image"
              >
                <svg
                  className="w-6 h-6 md:w-8 md:h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
          <div className="max-w-full max-h-[80vh] mx-2 md:mx-4">
            <img
              src={activity.gallery[selectedImageIndex]}
              alt={`${activity.name} - Ảnh ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {activity.gallery.length}
          </div>
          {activity.gallery.length > 1 && (
            <div className="absolute bottom-12 md:bottom-16 left-0 right-0 flex justify-center overflow-x-auto py-2">
              <div className="flex space-x-2 px-4 max-w-full">
                {activity.gallery.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-12 h-9 md:w-16 md:h-12 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                      idx === selectedImageIndex
                        ? "border-white"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}
