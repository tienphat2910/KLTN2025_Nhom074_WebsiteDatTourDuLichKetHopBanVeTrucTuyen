"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface Activity {
  id: string;
  type:
    | "user_registered"
    | "booking_created"
    | "payment_completed"
    | "user_status_changed"
    | "system_alert";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const { socketService } = useSocket();

  useEffect(() => {
    // Set up real-time activity listeners
    const handleUserRegistered = (data: any) => {
      const activity: Activity = {
        id: `user_${Date.now()}`,
        type: "user_registered",
        title: "Người dùng mới đăng ký",
        description: `${data.user.fullName} (${data.user.email})`,
        timestamp: new Date(data.timestamp),
        user: data.user.fullName
      };
      addActivity(activity);
    };

    const handleBookingCreated = (data: any) => {
      const activity: Activity = {
        id: `booking_${Date.now()}`,
        type: "booking_created",
        title: "Đặt chỗ mới",
        description: `${
          data.booking.type
        } - ${data.booking.totalPrice?.toLocaleString("vi-VN")} VND`,
        timestamp: new Date(data.timestamp),
        user: "Hệ thống"
      };
      addActivity(activity);
    };

    const handlePaymentCompleted = (data: any) => {
      const activity: Activity = {
        id: `payment_${Date.now()}`,
        type: "payment_completed",
        title: "Thanh toán hoàn tất",
        description: `${data.payment.amount?.toLocaleString(
          "vi-VN"
        )} VND cho booking ${data.payment.bookingId}`,
        timestamp: new Date(data.timestamp),
        user: "Hệ thống"
      };
      addActivity(activity);
    };

    const handleUserStatusChanged = (data: any) => {
      const activity: Activity = {
        id: `status_${Date.now()}`,
        type: "user_status_changed",
        title: "Trạng thái người dùng thay đổi",
        description: `Người dùng ${data.userId} từ ${data.oldStatus} → ${data.newStatus}`,
        timestamp: new Date(data.timestamp),
        user: data.changedBy || "Admin"
      };
      addActivity(activity);
    };

    const handleSystemAlert = (data: any) => {
      const activity: Activity = {
        id: `alert_${Date.now()}`,
        type: "system_alert",
        title: "Cảnh báo hệ thống",
        description: data.message,
        timestamp: new Date(data.timestamp),
        user: "Hệ thống"
      };
      addActivity(activity);
    };

    socketService.on("user_registered", handleUserRegistered);
    socketService.on("booking_created", handleBookingCreated);
    socketService.on("payment_completed", handlePaymentCompleted);
    socketService.on("user_status_changed", handleUserStatusChanged);
    socketService.on("system_alert", handleSystemAlert);

    // Cleanup
    return () => {
      socketService.off("user_registered", handleUserRegistered);
      socketService.off("booking_created", handleBookingCreated);
      socketService.off("payment_completed", handlePaymentCompleted);
      socketService.off("user_status_changed", handleUserStatusChanged);
      socketService.off("system_alert", handleSystemAlert);
    };
  }, [socketService]);

  const addActivity = (activity: Activity) => {
    setActivities((prev) => [activity, ...prev.slice(0, 19)]); // Keep max 20 activities
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "user_registered":
        return "bg-blue-500";
      case "booking_created":
        return "bg-green-500";
      case "payment_completed":
        return "bg-yellow-500";
      case "user_status_changed":
        return "bg-orange-500";
      case "system_alert":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động real-time</CardTitle>
        <CardDescription>Cập nhật tức thời từ hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có hoạt động nào</p>
              <p className="text-sm">
                Hoạt động sẽ xuất hiện ở đây khi có thay đổi
              </p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={`h-2 w-2 rounded-full mt-2 ${getActivityColor(
                    activity.type
                  )}`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      bởi {activity.user}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
