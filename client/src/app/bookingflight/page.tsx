"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { flightService, Flight } from "@/services/flightService";
import { bookingFlightService } from "@/services/bookingFlightService";
import { paymentService } from "@/services/paymentService";
import { Discount } from "@/types/discount";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import { Users, DollarSign } from "lucide-react";
import {
  DiscountCode,
  PaymentMethod,
  SpecialRequest,
  validateFlightPassengers,
  validatePaymentMethod,
  FlightPassenger
} from "@/components/Booking/Common";
import {
  FlightPassengerForm,
  FlightPriceSummary
} from "@/components/Booking/Flight";

export default function BookingFlightPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  const flightId = searchParams.get("flightId");
  const scheduleId = searchParams.get("scheduleId");
  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);
  const seatClass = searchParams.get("seatClass") || "economy";

  // Add-ons from URL
  const extraBaggage = Number(searchParams.get("extraBaggage") || 0);
  const insurance = searchParams.get("insurance") === "true";
  const prioritySeat = searchParams.get("prioritySeat") === "true";
  const selectedSeatsParam = searchParams.get("selectedSeats") || "";
  const selectedSeats = selectedSeatsParam
    ? selectedSeatsParam.split(",").filter(Boolean)
    : [];

  // Pricing constants for add-ons
  const EXTRA_BAGGAGE_PRICE = 200000;
  const INSURANCE_PRICE = 150000;
  const PRIORITY_SEAT_PRICE = 100000;

  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Passenger information
  const [passengers, setPassengers] = useState<FlightPassenger[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Initialize passenger info
  useEffect(() => {
    const passengerList: FlightPassenger[] = [];

    // Add adults (require CCCD)
    for (let i = 0; i < adults; i++) {
      passengerList.push({
        fullName: i === 0 && user?.fullName ? user.fullName : "",
        phoneNumber: i === 0 && user?.phone ? user.phone : undefined,
        email: i === 0 && user?.email ? user.email : undefined,
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: "",
        nationality: "Vietnam"
      });
    }

    // Add children (no CCCD needed)
    for (let i = 0; i < children; i++) {
      passengerList.push({
        fullName: "",
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: undefined,
        nationality: "Vietnam"
      });
    }

    // Add infants (no CCCD needed)
    for (let i = 0; i < infants; i++) {
      passengerList.push({
        fullName: "",
        gender: "Nam",
        dateOfBirth: "",
        identityNumber: undefined,
        nationality: "Vietnam"
      });
    }

    setPassengers(passengerList);
  }, [adults, children, infants, user]);

  useEffect(() => {
    if (flightId) {
      flightService
        .getFlightById(flightId)
        .then((data) => {
          setFlight(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading flight:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [flightId]);

  const updatePassenger = (
    index: number,
    field: keyof FlightPassenger,
    value: string
  ) => {
    setPassengers((prev) =>
      prev.map((passenger, i) =>
        i === index ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  // Calculate discount amount
  const calculateDiscountAmount = (subtotal: number) => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.discountType === "percentage") {
      return Math.round((subtotal * appliedDiscount.value) / 100);
    } else {
      return Math.min(appliedDiscount.value, subtotal);
    }
  };

  // Calculate final total after discount
  const calculateFinalTotal = (subtotal: number) => {
    return subtotal - calculateDiscountAmount(subtotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    // Validate passenger information
    if (!validateFlightPassengers(passengers, adults)) {
      return;
    }

    if (!validatePaymentMethod(paymentMethod)) {
      return;
    }

    if (!flight) {
      toast.error("Không tìm thấy thông tin chuyến bay.");
      return;
    }

    if (!flight.classes || flight.classes.length === 0) {
      toast.error("Thiếu thông tin giá vé.");
      return;
    }

    setSubmitting(true);

    try {
      // Get selected flight class
      const selectedClass = flight.classes.find(
        (c) => c.className.toLowerCase() === seatClass.toLowerCase()
      );

      if (!selectedClass) {
        toast.error("Thiếu thông tin giá vé cho hạng ghế.");
        return;
      }

      // Calculate total amount with age-based pricing
      const numTickets = adults + children + infants;
      const baseTicketPrice = selectedClass.price;
      const pricePerTicket = baseTicketPrice;

      const adultsTotal = adults * baseTicketPrice;
      const childrenTotal = children * (baseTicketPrice * 0.9);
      const infantsTotal = infants * (baseTicketPrice * 0.1);
      const totalFlightPrice = adultsTotal + childrenTotal + infantsTotal;

      // Calculate add-ons
      const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
      const insuranceTotal = insurance ? numTickets * INSURANCE_PRICE : 0;
      const prioritySeatTotal = prioritySeat
        ? numTickets * PRIORITY_SEAT_PRICE
        : 0;
      const addOnsTotal = baggageTotal + insuranceTotal + prioritySeatTotal;

      const subtotalWithAddons = totalFlightPrice + addOnsTotal;

      const discountAmount = calculateDiscountAmount(subtotalWithAddons);
      const finalTotal = calculateFinalTotal(subtotalWithAddons);

      // Assign selected seats to passengers (if seats were chosen)
      const passengersWithSeats = passengers.map((p, index) => {
        if (selectedSeats.length > index) {
          return { ...p, seatNumber: selectedSeats[index] };
        }
        return p;
      });

      // Prepare note with add-ons information
      let bookingNote = note;
      const addOnsInfo = [];
      if (extraBaggage > 0) {
        addOnsInfo.push(
          `Hành lý thêm: ${extraBaggage} kiện (${baggageTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (insurance) {
        addOnsInfo.push(
          `Bảo hiểm du lịch: ${numTickets} người (${insuranceTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (prioritySeat) {
        addOnsInfo.push(
          `Chỗ ngồi ưu tiên: ${numTickets} người (${prioritySeatTotal.toLocaleString(
            "vi-VN"
          )} đ)`
        );
      }
      if (addOnsInfo.length > 0) {
        bookingNote = `${
          bookingNote ? bookingNote + "\n\n" : ""
        }Dịch vụ bổ sung:\n${addOnsInfo.join("\n")}`;
      }

      // If payment method is MoMo, handle MoMo payment flow
      if (paymentMethod === "momo") {
        try {
          const momoResponse = await paymentService.createMoMoPayment({
            amount: finalTotal,
            orderInfo: `Thanh toán vé máy bay: ${flight.flightCode}`,
            extraData: JSON.stringify({
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              passengers: passengersWithSeats,
              note: bookingNote,
              discountCode: appliedDiscount?.code,
              discountAmount,
              scheduleId
            })
          });

          if (momoResponse.success && momoResponse.data?.payUrl) {
            const bookingData = {
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers: passengersWithSeats,
              note: bookingNote,
              paymentMethod,
              momoOrderId: momoResponse.data.orderId,
              scheduleId
            };

            localStorage.setItem(
              "pendingFlightBooking",
              JSON.stringify(bookingData)
            );
            toast.success("Đang chuyển hướng đến trang thanh toán MoMo...");
            paymentService.redirectToMoMoPayment(momoResponse.data.payUrl);
            return;
          } else {
            throw new Error(
              momoResponse.message || "Không thể tạo thanh toán MoMo"
            );
          }
        } catch (momoError) {
          console.error("MoMo payment error:", momoError);
          toast.error("Lỗi khi tạo thanh toán MoMo. Vui lòng thử lại!");
          setSubmitting(false);
          return;
        }
      }

      // If payment method is ZaloPay, handle ZaloPay payment flow
      if (paymentMethod === "zalopay") {
        try {
          const zalopayResponse = await paymentService.createZaloPayPayment({
            amount: finalTotal,
            description: `Thanh toán vé máy bay: ${flight.flightCode}`,
            extraData: JSON.stringify({
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              passengers: passengersWithSeats,
              note: bookingNote,
              discountCode: appliedDiscount?.code,
              discountAmount,
              scheduleId
            })
          });

          if (zalopayResponse.success && zalopayResponse.data?.order_url) {
            const bookingData = {
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers: passengersWithSeats,
              note: bookingNote,
              paymentMethod,
              zalopayTransId: zalopayResponse.data.app_trans_id,
              scheduleId
            };

            localStorage.setItem(
              "pendingFlightBooking",
              JSON.stringify(bookingData)
            );
            toast.success("Đang chuyển hướng đến trang thanh toán ZaloPay...");
            window.location.href = zalopayResponse.data.order_url;
            return;
          } else {
            throw new Error(
              zalopayResponse.message || "Không thể tạo thanh toán ZaloPay"
            );
          }
        } catch (zalopayError) {
          console.error("ZaloPay payment error:", zalopayError);
          toast.error("Lỗi khi tạo thanh toán ZaloPay. Vui lòng thử lại!");
          setSubmitting(false);
          return;
        }
      }

      // For other payment methods, proceed with normal booking flow
      const res = await bookingFlightService.createBookingFlight({
        flightId: flight._id,
        flightCode: flight.flightCode,
        flightClassId: selectedClass._id,
        numTickets,
        pricePerTicket,
        totalFlightPrice,
        discountAmount,
        finalTotal,
        discountCode: appliedDiscount?.code,
        status: "pending",
        passengers: passengersWithSeats as any,
        note: bookingNote,
        paymentMethod,
        scheduleId
      });

      if (res.success) {
        toast.success("Đặt vé thành công!");
        router.push("/profile/booking");
      } else {
        if (res.requireAuth) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`
          );
        } else {
          toast.error(res.message || "Đặt vé thất bại!");
        }
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang chuyển hướng đến trang đăng nhập...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang tải thông tin chuyến bay...</div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Không tìm thấy chuyến bay.</div>
      </div>
    );
  }

  const selectedClass = flight.classes?.find(
    (c) => c.className.toLowerCase() === seatClass.toLowerCase()
  );
  const baseTicketPrice = selectedClass?.price || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />
      <div className="py-8 mt-16 sm:mt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                Đặt vé máy bay: {flight.flightCode}
              </h1>
              <div className="flex items-center text-blue-100">
                <span className="mr-4 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {adults + children + infants}{" "}
                  hành khách
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Tổng:{" "}
                  {(() => {
                    const adultsTotal = adults * baseTicketPrice;
                    const childrenTotal = children * (baseTicketPrice * 0.9);
                    const infantsTotal = infants * (baseTicketPrice * 0.1);
                    const totalFlightPrice =
                      adultsTotal + childrenTotal + infantsTotal;
                    const numTickets = adults + children + infants;
                    const baggageTotal = extraBaggage * EXTRA_BAGGAGE_PRICE;
                    const insuranceTotal = insurance
                      ? numTickets * INSURANCE_PRICE
                      : 0;
                    const prioritySeatTotal = prioritySeat
                      ? numTickets * PRIORITY_SEAT_PRICE
                      : 0;
                    const addOnsTotal =
                      baggageTotal + insuranceTotal + prioritySeatTotal;
                    const subtotal = totalFlightPrice + addOnsTotal;
                    const finalTotal = calculateFinalTotal(subtotal);
                    return finalTotal.toLocaleString("vi-VN");
                  })()}{" "}
                  đ
                  {appliedDiscount && (
                    <span className="ml-2 text-yellow-300 text-sm">
                      (Đã áp dụng mã giảm giá)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* User Account Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Thông tin tài khoản đặt vé
                </h3>
                <p className="text-sm text-blue-700">
                  Đăng nhập với: {user?.email}
                </p>
              </div>

              {/* Passenger Information - Using Component */}
              <FlightPassengerForm
                passengers={passengers}
                adults={adults}
                children={children}
                infants={infants}
                updatePassenger={updatePassenger}
              />

              {/* Discount Code Section - Using Component */}
              <DiscountCode
                discountCode={discountCode}
                setDiscountCode={setDiscountCode}
                appliedDiscount={appliedDiscount}
                setAppliedDiscount={setAppliedDiscount}
              />

              {/* Payment Method Selection - Using Component (No Cash for Flights) */}
              <PaymentMethod
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                showCash={false}
              />

              {/* Special Requests - Using Component */}
              <SpecialRequest note={note} setNote={setNote} />

              {/* Flight Summary - Using Component */}
              <FlightPriceSummary
                adults={adults}
                children={children}
                infants={infants}
                baseTicketPrice={baseTicketPrice}
                extraBaggage={extraBaggage}
                insurance={insurance}
                prioritySeat={prioritySeat}
                EXTRA_BAGGAGE_PRICE={EXTRA_BAGGAGE_PRICE}
                INSURANCE_PRICE={INSURANCE_PRICE}
                PRIORITY_SEAT_PRICE={PRIORITY_SEAT_PRICE}
                appliedDiscount={appliedDiscount}
                calculateDiscountAmount={calculateDiscountAmount}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  "Xác nhận đặt vé"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
