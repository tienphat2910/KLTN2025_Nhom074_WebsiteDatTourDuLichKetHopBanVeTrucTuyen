"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";

export default function DestinationLoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main destinations page after a short delay
    const timer = setTimeout(() => {
      router.push("/destinations");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner
          type="travel"
          size="xl"
          text="Đang tải thông tin địa điểm..."
        />
        <p className="mt-6 text-gray-600 text-center">
          Địa điểm đang được cập nhật. Chuyển hướng về trang chính...
        </p>
      </div>
      <Footer />
    </div>
  );
}
