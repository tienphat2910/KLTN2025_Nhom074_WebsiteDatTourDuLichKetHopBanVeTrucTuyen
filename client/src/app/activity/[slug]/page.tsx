"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function formatVND(amount: number) {
  return amount?.toLocaleString("vi-VN") + "đ";
}

export default function ActivityDetail() {
  const { slug } = useParams();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    axios
      .get(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/activities/slug/${slug}`
      )
      .then((res) => {
        if (res.data.success) setActivity(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <span>Không tìm thấy hoạt động</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-orange-700 mb-2">
            {activity.name}
          </h1>
          <p className="text-gray-600 mb-2">
            📍 {activity.location?.name}{" "}
            {activity.location?.address ? `- ${activity.location.address}` : ""}
          </p>
          <p className="text-gray-700 mb-4">{activity.description}</p>
          {activity.gallery && activity.gallery.length > 0 && (
            <div className="mb-4">
              <img
                src={activity.gallery[0]}
                alt={activity.name}
                className="rounded-xl w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-2">Giá vé</h2>
          {activity.price && activity.price.retail && (
            <ul className="text-gray-700">
              {activity.price.retail.adult && (
                <li>
                  Người lớn:{" "}
                  <span className="font-bold">
                    {formatVND(activity.price.retail.adult)}
                  </span>
                </li>
              )}
              {activity.price.retail.child && (
                <li>
                  Trẻ em:{" "}
                  <span className="font-bold">
                    {formatVND(activity.price.retail.child)}
                  </span>
                </li>
              )}
              {activity.price.retail.baby && (
                <li>
                  Em bé:{" "}
                  <span className="font-bold">
                    {formatVND(activity.price.retail.baby)}
                  </span>
                </li>
              )}
              {activity.price.retail.senior && (
                <li>
                  Người cao tuổi:{" "}
                  <span className="font-bold">
                    {formatVND(activity.price.retail.senior)}
                  </span>
                </li>
              )}
              {activity.price.retail.locker && (
                <li>
                  Tủ khoá:{" "}
                  <span className="font-bold">
                    {formatVND(activity.price.retail.locker)}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-2">
            Giờ hoạt động
          </h2>
          {activity.operating_hours && (
            <ul className="text-gray-700">
              <li>Thứ 2 - Thứ 7: {activity.operating_hours.mon_to_sat}</li>
              <li>Chủ nhật & lễ: {activity.operating_hours.sunday_holidays}</li>
              <li>Ngưng bán vé: {activity.operating_hours.ticket_cutoff}</li>
              <li>Kết thúc trò chơi: {activity.operating_hours.rides_end}</li>
            </ul>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-2">
            Điểm nổi bật
          </h2>
          <ul className="text-gray-700">
            {(activity.features || []).map((feature: string, idx: number) => (
              <li key={idx}>- {feature}</li>
            ))}
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-orange-700 mb-2">
            Chi tiết
          </h2>
          <ul className="text-gray-700">
            {Object.values(activity.detail || {}).map(
              (d: string, idx: number) => (d ? <li key={idx}>{d}</li> : null)
            )}
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
