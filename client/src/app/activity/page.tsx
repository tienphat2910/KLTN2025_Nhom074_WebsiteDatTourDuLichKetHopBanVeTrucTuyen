"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

export default function Entertainment() {
  const [isVisible, setIsVisible] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    setIsVisible(true);
    axios
      .get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/activities`
      )
      .then((res) => {
        if (res.data.success) setActivities(res.data.data);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-[10s] ease-in-out"
            style={{
              backgroundImage: "url('/images/banner-entertainment.webp')"
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/50 via-red-900/40 to-pink-900/50"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "animate-fade-in" : "opacity-0"
            }`}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-2xl">
              Vé{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Giải Trí
              </span>
            </h1>
            <p className="text-xl text-white/90 mb-8 drop-shadow-lg">
              Đặt vé các điểm vui chơi giải trí hấp dẫn
            </p>
          </div>
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
            {activities
              .filter((activity) => activity.popular)
              .map((activity, index) => (
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
                    <p className="text-gray-600 mb-2">
                      📍{" "}
                      {activity.location
                        ? `${activity.location.name || ""} ${
                            activity.location.address
                              ? "- " + activity.location.address
                              : ""
                          }`
                        : ""}
                    </p>
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">
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
                      <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2 rounded-lg shadow">
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
