"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/Admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import {
  cancellationRequestService,
  CancellationRequest
} from "@/services/cancellationRequestService";
import { CancellationRequestStats } from "@/components/Admin/CancellationRequestStats";
import { CancellationRequestCard } from "@/components/Admin/CancellationRequestCard";
import { FlightBookingDetailModal } from "@/components/Admin/FlightBookingDetailModal";
import { TourBookingDetailModal } from "@/components/Admin/TourBookingDetailModal";
import { ActivityBookingDetailModal } from "@/components/Admin/ActivityBookingDetailModal";

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  approved: {
    label: "Đã chấp nhận",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  rejected: {
    label: "Đã từ chối",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  }
};

export default function CancellationRequestsPage() {
  const { user, isAuthLoading } = useAuth();
  const { isConnected, socketService } = useSocket();
  const router = useRouter();
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<
    CancellationRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Load requests
  useEffect(() => {
    if (!isAuthLoading && user?.role === "admin") {
      loadRequests();
    }
  }, [isAuthLoading, user]);

  // Filter requests when tab changes
  useEffect(() => {
    if (activeTab === "all") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === activeTab));
    }
  }, [requests, activeTab]);

  // Listen for socket events
  useEffect(() => {
    if (!isConnected || !socketService) return;

    const handleNewRequest = (data: any) => {
      console.log("🎉 New cancellation request received:", data);
      loadRequests();
      toast.info("Có yêu cầu hủy mới!", {
        description: data.message || "Vui lòng kiểm tra và xử lý"
      });
    };

    const handleRequestProcessed = (data: any) => {
      console.log("✅ Cancellation request processed:", data);
      loadRequests();
    };

    // Listen to socket events
    socketService.on("new_cancellation_request", handleNewRequest);
    socketService.on("cancellation_request_processed", handleRequestProcessed);

    return () => {
      socketService.off("new_cancellation_request", handleNewRequest);
      socketService.off(
        "cancellation_request_processed",
        handleRequestProcessed
      );
    };
  }, [isConnected, socketService]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await cancellationRequestService.getAllRequests();

      if (response.success && Array.isArray(response.data)) {
        const sortedRequests = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRequests(sortedRequests);
      } else {
        toast.error(response.message || "Không thể tải danh sách yêu cầu hủy");
      }
    } catch (error) {
      console.error("Load requests error:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const getRequestStats = () => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length
    };
  };

  const stats = getRequestStats();

  // Redirect if not admin
  if (!isAuthLoading && user?.role !== "admin") {
    router.push("/admin");
    return null;
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout
      title="Yêu cầu hủy booking"
      breadcrumbs={[{ label: "Yêu cầu hủy" }]}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <CancellationRequestStats stats={stats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Chờ xử lý ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Đã chấp nhận ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Đã từ chối ({stats.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Tất cả ({stats.total})
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Đang tải...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Chưa có yêu cầu nào
                      </h3>
                      <p className="text-gray-600">
                        {activeTab === "all"
                          ? "Chưa có yêu cầu hủy nào được gửi lên."
                          : `Chưa có yêu cầu hủy ${statusConfig[
                              activeTab as keyof typeof statusConfig
                            ]?.label.toLowerCase()}.`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <CancellationRequestCard
                    key={request._id}
                    request={request}
                    onSuccess={loadRequests}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
