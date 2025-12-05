"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Loader2, Search, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { tourService, Tour } from "@/services/tourService";
import { activityService } from "@/services/activityService";
import { Activity } from "@/types/activity";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type BookingType = "tour" | "activity";

interface UserSearchResult {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export function CreateBookingModal({
  isOpen,
  onClose,
  onSuccess
}: CreateBookingModalProps) {
  const [bookingType, setBookingType] = useState<BookingType>("tour");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // User search
  const [userEmail, setUserEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );

  // Tour fields
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState("");
  const [tourAdults, setTourAdults] = useState(1);
  const [tourChildren, setTourChildren] = useState(0);
  const [tourInfants, setTourInfants] = useState(0);

  // Activity fields
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [activityDate, setActivityDate] = useState<Date>();
  const [activityAdults, setActivityAdults] = useState(1);
  const [activityChildren, setActivityChildren] = useState(0);

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState<"banking" | "momo">(
    "banking"
  );
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid">(
    "pending"
  );

  // Load data based on booking type
  useEffect(() => {
    if (isOpen) {
      if (bookingType === "tour") {
        loadTours();
      } else if (bookingType === "activity") {
        loadActivities();
      }
    }
  }, [bookingType, isOpen]);

  const loadTours = async () => {
    try {
      const response = await tourService.getTours({ limit: 100 });
      if (response.success) {
        setTours(response.data.tours);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách tour");
    }
  };

  const loadActivities = async () => {
    try {
      const response = await activityService.getActivities({ limit: 100 });
      if (response.success) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách hoạt động");
    }
  };

  const searchUserByEmail = async () => {
    if (!userEmail.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/search?email=${userEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        setSelectedUser(result.data);
        toast.success(`Tìm thấy: ${result.data.fullName}`);
      } else {
        toast.error("Không tìm thấy người dùng với email này");
        setSelectedUser(null);
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm người dùng");
      setSelectedUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const calculateTourPrice = (): number => {
    const tour = tours.find((t) => t._id === selectedTour);
    if (!tour) return 0;

    const pricePerPerson = tour.price * (1 - tour.discount / 100);

    if (tour.pricingByAge) {
      return (
        tourAdults * (tour.pricingByAge.adult || pricePerPerson) +
        tourChildren * (tour.pricingByAge.child || pricePerPerson * 0.7) +
        tourInfants * (tour.pricingByAge.infant || 0)
      );
    }

    return (tourAdults + tourChildren) * pricePerPerson;
  };

  const calculateActivityPrice = (): number => {
    const activity = activities.find((a) => a._id === selectedActivity);
    if (!activity || !activity.price) return 0;

    const adultPrice = activity.price.retail?.adult || 0;
    const childPrice = activity.price.retail?.child || adultPrice * 0.7;

    return activityAdults * adultPrice + activityChildren * childPrice;
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("Vui lòng tìm và chọn người dùng");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("lutrip_admin_token");
      let bookingData: any = {
        userId: selectedUser._id,
        bookingType,
        paymentMethod,
        paymentStatus
      };

      // Create main booking first
      if (bookingType === "tour") {
        if (!selectedTour) {
          toast.error("Vui lòng chọn tour");
          setIsLoading(false);
          return;
        }

        const totalPrice = calculateTourPrice();
        bookingData = {
          ...bookingData,
          totalPrice,
          status: paymentStatus === "paid" ? "confirmed" : "pending"
        };

        const bookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/booking`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
          }
        );

        const bookingResult = await bookingResponse.json();

        if (!bookingResult.success) {
          throw new Error(bookingResult.message || "Không thể tạo booking");
        }

        // Create tour booking
        const tourBookingData = {
          bookingId: bookingResult.data._id,
          tourId: selectedTour,
          adults: tourAdults,
          children: tourChildren,
          infants: tourInfants,
          totalPrice
        };

        const tourBookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bookingtours`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(tourBookingData)
          }
        );

        const tourBookingResult = await tourBookingResponse.json();

        if (!tourBookingResult.success) {
          throw new Error(
            tourBookingResult.message || "Không thể tạo booking tour"
          );
        }

        toast.success("Tạo booking tour thành công!");
      } else if (bookingType === "activity") {
        if (!selectedActivity || !activityDate) {
          toast.error("Vui lòng chọn hoạt động và ngày thực hiện");
          setIsLoading(false);
          return;
        }

        const totalPrice = calculateActivityPrice();
        bookingData = {
          ...bookingData,
          totalPrice,
          status: paymentStatus === "paid" ? "confirmed" : "pending"
        };

        const bookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/booking`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(bookingData)
          }
        );

        const bookingResult = await bookingResponse.json();

        if (!bookingResult.success) {
          throw new Error(bookingResult.message || "Không thể tạo booking");
        }

        // Create activity booking
        const activityBookingData = {
          bookingId: bookingResult.data._id,
          activityId: selectedActivity,
          scheduledDate: activityDate.toISOString(),
          adults: activityAdults,
          children: activityChildren,
          totalPrice
        };

        const activityBookingResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/bookingactivities`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(activityBookingData)
          }
        );

        const activityBookingResult = await activityBookingResponse.json();

        if (!activityBookingResult.success) {
          throw new Error(
            activityBookingResult.message || "Không thể tạo booking activity"
          );
        }

        toast.success("Tạo booking hoạt động thành công!");
      }

      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi tạo booking");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBookingType("tour");
    setUserEmail("");
    setSelectedUser(null);
    setSelectedTour("");
    setTourAdults(1);
    setTourChildren(0);
    setTourInfants(0);
    setSelectedActivity("");
    setActivityDate(undefined);
    setActivityAdults(1);
    setActivityChildren(0);
    setPaymentMethod("banking");
    setPaymentStatus("pending");
    onClose();
  };

  const getTotalPrice = () => {
    if (bookingType === "tour") return calculateTourPrice();
    if (bookingType === "activity") return calculateActivityPrice();
    return 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo Booking Mới</DialogTitle>
          <DialogDescription>
            Tạo booking cho khách hàng. Tìm người dùng theo email và chọn loại
            booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label>Tìm Người Dùng</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập email người dùng"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUserByEmail()}
              />
              <Button
                onClick={searchUserByEmail}
                disabled={isSearching}
                type="button"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {selectedUser && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium">{selectedUser.fullName}</p>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                )}
              </div>
            )}
          </div>

          {/* Booking Type Selection */}
          <div className="space-y-2">
            <Label>Loại Booking</Label>
            <Select
              value={bookingType}
              onValueChange={(value) => setBookingType(value as BookingType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tour">Tour</SelectItem>
                <SelectItem value="activity">Hoạt Động</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              * Booking chuyến bay được tạo tự động khi khách đặt vé
            </p>
          </div>

          {/* Tour Booking Fields */}
          {bookingType === "tour" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn Tour</Label>
                <Select value={selectedTour} onValueChange={setSelectedTour}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tour" />
                  </SelectTrigger>
                  <SelectContent>
                    {tours.map((tour) => (
                      <SelectItem key={tour._id} value={tour._id}>
                        {tour.title} -{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND"
                        }).format(tour.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Người lớn</Label>
                  <Input
                    type="number"
                    min="1"
                    value={tourAdults}
                    onChange={(e) => setTourAdults(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trẻ em</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tourChildren}
                    onChange={(e) => setTourChildren(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Em bé</Label>
                  <Input
                    type="number"
                    min="0"
                    value={tourInfants}
                    onChange={(e) => setTourInfants(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Booking Fields */}
          {bookingType === "activity" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chọn Hoạt Động</Label>
                <Select
                  value={selectedActivity}
                  onValueChange={setSelectedActivity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hoạt động" />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((activity) => (
                      <SelectItem key={activity._id} value={activity._id}>
                        {activity.name} -{" "}
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND"
                        }).format(activity.price?.retail?.adult || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ngày Thực Hiện</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !activityDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {activityDate ? (
                        format(activityDate, "dd/MM/yyyy")
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={activityDate}
                      onSelect={setActivityDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Người lớn</Label>
                  <Input
                    type="number"
                    min="1"
                    value={activityAdults}
                    onChange={(e) =>
                      setActivityAdults(parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trẻ em</Label>
                  <Input
                    type="number"
                    min="0"
                    value={activityChildren}
                    onChange={(e) =>
                      setActivityChildren(parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phương Thức Thanh Toán</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as "banking" | "momo")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banking">Chuyển khoản</SelectItem>
                  <SelectItem value="momo">MoMo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trạng Thái Thanh Toán</Label>
              <Select
                value={paymentStatus}
                onValueChange={(value) =>
                  setPaymentStatus(value as "pending" | "paid")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total Price */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-gray-600">Tổng Tiền</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND"
              }).format(getTotalPrice())}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedUser}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tạo Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
