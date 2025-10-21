import { Clock, CheckCircle, X, Mountain, MapPin, Plane } from "lucide-react";

export const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle
  },
  cancelled: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: X
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  }
};

export const bookingTypeConfig = {
  tour: {
    label: "Tour du lịch",
    icon: Mountain,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  activity: {
    label: "Hoạt động",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  },
  flight: {
    label: "Chuyến bay",
    icon: Plane,
    color: "text-green-600",
    bgColor: "bg-green-50"
  }
};
