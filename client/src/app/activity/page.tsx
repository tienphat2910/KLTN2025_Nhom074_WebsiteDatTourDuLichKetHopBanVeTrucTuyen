"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { env } from "@/config/env";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, FileText, Ticket } from "lucide-react";
function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

export default function Activity() {
  const [isVisible, setIsVisible] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [keyword, setKeyword] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000000); // Tăng lên 100 triệu
  const [selectedDestination, setSelectedDestination] = useState("");
  const [pendingDestination, setPendingDestination] =
    useState(selectedDestination);
  const [destinations, setDestinations] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    axios
      .get(`${env.API_BASE_URL}/activities`)
      .then((res) => {
        console.log("Activities API response:", res.data);
        if (res.data.success) {
          // Đảm bảo activities luôn là array
          if (Array.isArray(res.data.data)) {
            console.log("Activities array (direct):", res.data.data);
            setActivities(res.data.data);
          } else if (Array.isArray(res.data.data.activities)) {
            console.log("Activities array (nested):", res.data.data.activities);
            setActivities(res.data.data.activities);
          } else {
            console.log("No activities array found");
            setActivities([]);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching activities:", err);
        setActivities([]);
      });
    axios
      .get(`${env.API_BASE_URL}/destinations`)
      .then((res) => {
        if (res.data.success) {
          // Đảm bảo lấy đúng mảng
          if (Array.isArray(res.data.data)) {
            setDestinations(res.data.data);
          } else if (Array.isArray(res.data.data.destinations)) {
            setDestinations(res.data.data.destinations);
          } else {
            setDestinations([]);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching destinations:", err);
        setDestinations([]);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchValue);
    setSelectedDestination(pendingDestination);
  };

  // Lọc theo từ khoá, địa điểm, giá
  const filteredActivities = Array.isArray(activities)
    ? activities
        .filter((activity) =>
          keyword.trim() === ""
            ? true
            : ((activity.name || "") + " " + (activity.description || ""))
                .toLowerCase()
                .includes(keyword.toLowerCase())
        )
        .filter((activity) =>
          selectedDestination
            ? activity.destinationId === selectedDestination
            : true
        )
        .filter((activity) => {
          const price = activity.price?.retail?.adult || 0;
          return price >= minPrice && price <= maxPrice;
        })
    : [];

  console.log("Total activities:", activities.length);
  console.log("Filtered activities:", filteredActivities.length);
  console.log("Filters:", { keyword, selectedDestination, minPrice, maxPrice });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://static.vinwonders.com/production/DJI_20231015142010_0245_D.jpg"
            alt="Activities Background"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 35%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 via-red-900/40 to-pink-900/50"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Vé <span className="">Giải Trí</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Đặt vé các điểm vui chơi giải trí hấp dẫn
            </p>
          </div>
          {/* Search & Filter Form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-center md:gap-4 bg-white rounded-3xl shadow-lg px-4 md:px-8 py-6 w-full max-w-3xl"
            style={{ fontFamily: "inherit" }}
          >
            {/* Tìm kiếm từ khoá */}
            <div className="flex flex-col w-full md:flex-1">
              <label className="font-bold text-gray-800 mb-1 text-sm">
                Từ khoá hoạt động
              </label>
              <input
                type="text"
                className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Nhập tên hoặc mô tả hoạt động..."
              />
            </div>
            {/* Địa điểm */}
            <div className="flex flex-col w-full md:flex-[0.8] md:max-w-xs">
              <label className="font-bold text-gray-800 mb-1 text-sm">
                Địa điểm
              </label>
              <select
                className="w-full border border-gray-400 rounded-lg px-4 py-3 text-base text-gray-800 bg-white"
                value={pendingDestination}
                onChange={(e) => setPendingDestination(e.target.value)}
                style={{
                  minWidth: "0px",
                  maxWidth: "100%",
                  width: "100%"
                }}
              >
                <option value="">Tất cả</option>
                {destinations.map((d: any) => (
                  <option
                    key={d._id}
                    value={d._id}
                    style={
                      pendingDestination === d._id
                        ? { backgroundColor: "#F97316", color: "#fff" }
                        : {}
                    }
                  >
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Nút tìm kiếm */}
            <div className="flex items-center w-full md:w-auto">
              <button
                type="submit"
                className="flex items-center gap-2 bg-[#F97316] text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-all text-base whitespace-nowrap w-full md:w-auto justify-center"
                style={{ minWidth: 140 }}
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Tìm kiếm
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="pt-2 pb-2">
        <div className="container mx-auto px-4">
          <nav className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="mx-2">›</span>
            <Link href="/destinations" className="hover:text-blue-600">
              VIỆT NAM
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-800 font-medium">Hoạt động</span>
          </nav>
        </div>
      </div>

      {/* Entertainment Section */}
      <section className="py-4 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-black mb-8 text-left">
            Hoạt động nổi bật
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActivities.map((activity, index) => (
              <div
                key={activity._id}
                className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-500 flex flex-col h-full"
              >
                {/* Gallery image nếu có */}
                <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center overflow-hidden">
                  {activity.gallery && activity.gallery.length > 0 ? (
                    <img
                      src={activity.gallery[0]}
                      alt={activity.name}
                      className="object-cover w-full h-full"
                    />
                  ) : null}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {activity.name}
                  </h3>
                  <p className="text-gray-600 mb-2 flex items-center gap-2 leading-tight">
                    <MapPin className="w-5 h-5 text-orange-600 shrink-0" />
                    {activity.location?.address
                      ? activity.location.address
                      : "Địa chỉ chưa cập nhật"}
                  </p>

                  <p className="text-gray-600 mb-4 flex items-center gap-2 leading-tight">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    {activity.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-sky-600" />
                      Giá vé:
                    </h4>
                    {activity.price && activity.price.retail && (
                      <ul className="text-sm text-gray-600">
                        {activity.price.retail.adult && (
                          <li>
                            Người lớn:{" "}
                            <span className="font-bold text-orange-600">
                              {formatVND(activity.price.retail.adult)}
                            </span>
                          </li>
                        )}
                        {activity.price.retail.child && (
                          <li>
                            Trẻ em:{" "}
                            <span className="font-bold text-orange-600">
                              {formatVND(activity.price.retail.child)}
                            </span>
                          </li>
                        )}
                        {activity.price.retail.senior && (
                          <li>
                            Người cao tuổi:{" "}
                            <span className="font-bold text-orange-600">
                              {formatVND(activity.price.retail.senior)}
                            </span>
                          </li>
                        )}
                        {activity.price.retail.locker && (
                          <li>
                            Tủ khoá:{" "}
                            <span className="font-bold text-orange-600">
                              {formatVND(activity.price.retail.locker)}
                            </span>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className="mt-auto flex justify-end">
                    <button
                      className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg shadow"
                      onClick={() =>
                        router.push(`/activity/detail/${activity.slug}`)
                      }
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
