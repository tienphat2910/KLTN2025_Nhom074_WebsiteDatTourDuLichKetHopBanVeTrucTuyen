"use client";

import { useEffect, useState } from "react";
import { getPersonalizedRecommendations } from "@/services/recommendationService";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface RecItem {
  id: string;
  title: string;
  thumbnail?: string | null;
  price?: number;
  reason?: string;
}

export default function PersonalizedRecommendations() {
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      type RecResponse = {
        success?: boolean;
        data?: {
          recommendations?: Array<{
            id: string;
            title?: string;
            thumbnail?: string | null;
            price?: number;
            reason?: string;
          }>;
        };
      };

      const res = (await getPersonalizedRecommendations()) as RecResponse;
      if (!mounted) return;
      if (res?.success && res.data && Array.isArray(res.data.recommendations)) {
        setItems(
          res.data.recommendations.map((r) => ({
            id: String(r.id),
            title: r.title || "Tour",
            thumbnail: r.thumbnail || null,
            price: r.price || 0,
            reason: r.reason || "Gợi ý cho bạn"
          }))
        );
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Đang tải gợi ý...</div>;
  if (items.length === 0) return null;

  return (
    <section className="my-6">
      <h3 className="text-lg font-semibold mb-3">Gợi ý cho bạn</h3>
      <Swiper
        spaceBetween={16}
        slidesPerView={1.8}
        breakpoints={{
          640: { slidesPerView: 2.4, spaceBetween: 16 },
          768: { slidesPerView: 3.2, spaceBetween: 18 },
          1024: { slidesPerView: 4.2, spaceBetween: 20 }
        }}
      >
        {items.map((it) => (
          <SwiperSlide key={it.id}>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md p-3 transform hover:scale-105 transition-all duration-200">
              <div className="relative h-44 w-full rounded overflow-hidden mb-3 bg-gray-100">
                {it.thumbnail ? (
                  // Use next/image when url available
                  <Image
                    src={it.thumbnail}
                    alt={it.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No image</div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 text-xs text-gray-800 rounded px-2 py-1 font-semibold shadow">{it.price ? it.price.toLocaleString('vi-VN') + ' đ' : 'Liên hệ'}</div>
              </div>
              <div className="text-sm font-medium mb-1 truncate">{it.title}</div>
              <div className="text-xs text-gray-500 mb-3">{it.reason}</div>
              <div className="flex items-center justify-between">
                <a href={`/tours/${it.id}`} className="text-sm text-sky-600 font-medium hover:underline">Xem chi tiết</a>
                <a href={`/tours/${it.id}`} className="px-3 py-1 text-xs bg-sky-500 text-white rounded">Đặt ngay</a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
