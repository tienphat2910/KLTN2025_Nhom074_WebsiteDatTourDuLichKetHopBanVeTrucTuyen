"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import { LoadingSpinner } from "@/components/Loading";

export default function PageTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoading, loadingType, startLoading, stopLoading } = useLoading();

  // Handle route changes
  useEffect(() => {
    startLoading("navigation");

    // Simulate minimum loading time for visual consistency
    const timer = setTimeout(() => {
      stopLoading();
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!isLoading || loadingType !== "navigation") return null;

  return (
    <div className="fixed top-16 left-0 w-full z-50 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 h-1 animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-slide"></div>
    </div>
  );
}
