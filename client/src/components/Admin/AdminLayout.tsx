"use client";

import { ReactNode, useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { socketService } from "@/services/socketService";
import { toast } from "sonner";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

interface Notification {
  id: string;
  type:
    | "user_registered"
    | "booking_created"
    | "payment_completed"
    | "user_status_changed"
    | "system_alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export function AdminLayout({
  children,
  title,
  breadcrumbs
}: AdminLayoutProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to socket when admin logs in
    const token = localStorage.getItem("lutrip_admin_token");
    if (token) {
      const connectSocket = async () => {
        try {
          await socketService.connect(token);

          // Wait for connection to be established
          const waitForConnection = () => {
            return new Promise<void>((resolve) => {
              if (socketService.isConnected()) {
                resolve();
              } else {
                const checkConnection = () => {
                  if (socketService.isConnected()) {
                    resolve();
                  } else {
                    setTimeout(checkConnection, 100);
                  }
                };
                checkConnection();
              }
            });
          };

          await waitForConnection();
          socketService.joinAdminRoom();
        } catch (error) {
          console.error("Failed to connect socket:", error);
        }
      };

      connectSocket();

      // Set up event listeners
      socketService.on("connected", () => {
        setIsConnected(true);
        console.log("Admin connected to socket");
      });

      socketService.on("disconnected", () => {
        setIsConnected(false);
        console.log("Admin disconnected from socket");
      });

      socketService.on("user_registered", (data: any) => {
        const notification: Notification = {
          id: `user_${Date.now()}`,
          type: "user_registered",
          title: "Người dùng mới đăng ký",
          message: `${data.user.fullName} vừa đăng ký tài khoản`,
          timestamp: new Date(data.timestamp),
          read: false,
          data: data.user
        };
        addNotification(notification);
        toast.info(`Người dùng mới: ${data.user.fullName}`, {
          description: data.user.email,
          duration: 5000
        });
      });

      socketService.on("booking_created", (data: any) => {
        const notification: Notification = {
          id: `booking_${Date.now()}`,
          type: "booking_created",
          title: "Đặt chỗ mới",
          message: `Đặt chỗ ${
            data.booking.type
          } trị giá ${data.booking.totalPrice?.toLocaleString("vi-VN")} VND`,
          timestamp: new Date(data.timestamp),
          read: false,
          data: data.booking
        };
        addNotification(notification);
        toast.success("Đặt chỗ mới!", {
          description: `${
            data.booking.type
          } - ${data.booking.totalPrice?.toLocaleString("vi-VN")} VND`,
          duration: 5000
        });
      });

      socketService.on("payment_completed", (data: any) => {
        const notification: Notification = {
          id: `payment_${Date.now()}`,
          type: "payment_completed",
          title: "Thanh toán hoàn tất",
          message: `Thanh toán ${data.payment.amount?.toLocaleString(
            "vi-VN"
          )} VND cho booking ${data.payment.bookingId}`,
          timestamp: new Date(data.timestamp),
          read: false,
          data: data.payment
        };
        addNotification(notification);
        toast.success("Thanh toán hoàn tất!", {
          description: `${data.payment.amount?.toLocaleString("vi-VN")} VND`,
          duration: 5000
        });
      });

      socketService.on("user_status_changed", (data: any) => {
        const notification: Notification = {
          id: `status_${Date.now()}`,
          type: "user_status_changed",
          title: "Trạng thái người dùng thay đổi",
          message: `Người dùng ${data.userId} từ ${data.oldStatus} → ${data.newStatus}`,
          timestamp: new Date(data.timestamp),
          read: false,
          data
        };
        addNotification(notification);
        toast.warning("Trạng thái người dùng thay đổi", {
          description: `${data.oldStatus} → ${data.newStatus}`,
          duration: 5000
        });
      });

      socketService.on("system_alert", (data: any) => {
        const notification: Notification = {
          id: `alert_${Date.now()}`,
          type: "system_alert",
          title: "Cảnh báo hệ thống",
          message: data.message,
          timestamp: new Date(data.timestamp),
          read: false,
          data
        };
        addNotification(notification);

        const toastType =
          data.type === "error"
            ? toast.error
            : data.type === "warning"
            ? toast.warning
            : toast.info;
        toastType("Cảnh báo hệ thống", {
          description: data.message,
          duration: 7000
        });
      });
    }

    // Cleanup on unmount
    return () => {
      socketService.off("connected");
      socketService.off("disconnected");
      socketService.off("user_registered");
      socketService.off("booking_created");
      socketService.off("payment_completed");
      socketService.off("user_status_changed");
      socketService.off("system_alert");
    };
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header with Notifications */}
        <div className="border-b bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              )}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex" aria-label="Breadcrumb">
                  <ol className="flex items-center space-x-2">
                    {breadcrumbs.map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && (
                          <span className="text-gray-400 mx-2">/</span>
                        )}
                        {crumb.href ? (
                          <a
                            href={crumb.href}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            {crumb.label}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-900 font-medium">
                            {crumb.label}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
            </div>

            {/* Notifications */}
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {isConnected ? "Online" : "Offline"}
                </span>
              </div>

              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Thông báo
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllNotifications}
                        className="text-xs"
                      >
                        Xóa tất cả
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex flex-col items-start p-3 cursor-pointer ${
                            !notification.read ? "bg-blue-50" : ""
                          }`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {notification.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {notification.timestamp.toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
