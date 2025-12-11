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
  FlightPassenger,
  PassengerValidationError
} from "@/components/Booking/Common";
import {
  FlightPassengerForm,
  FlightPriceSummary
} from "@/components/Booking/Flight";

export default function BookingFlightPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();

  // Check if round trip
  const isRoundTrip = searchParams.get("isRoundTrip") === "true";

  // One-way flight params
  const flightId = searchParams.get("flightId");
  const scheduleId = searchParams.get("scheduleId");

  // Round trip params
  const outboundFlightId = searchParams.get("outboundFlightId");
  const outboundScheduleId = searchParams.get("outboundScheduleId");
  const outboundSeatClass = searchParams.get("outboundSeatClass");
  const returnFlightId = searchParams.get("returnFlightId");
  const returnScheduleId = searchParams.get("returnScheduleId");
  const returnSeatClass = searchParams.get("returnSeatClass");

  const adults = Number(searchParams.get("adults") || 1);
  const children = Number(searchParams.get("children") || 0);
  const infants = Number(searchParams.get("infants") || 0);
  const seatClass =
    searchParams.get("seatClass") || outboundSeatClass || "economy";

  // Add-ons from URL (for one-way)
  const extraBaggage = Number(searchParams.get("extraBaggage") || 0);
  const insurance = searchParams.get("insurance") === "true";
  const prioritySeat = searchParams.get("prioritySeat") === "true";
  const selectedSeatsParam = searchParams.get("selectedSeats") || "";
  const selectedSeats = selectedSeatsParam
    ? selectedSeatsParam.split(",").filter(Boolean)
    : [];

  // Round trip add-ons
  const outboundExtraBaggage = Number(
    searchParams.get("outboundExtraBaggage") || 0
  );
  const outboundInsurance = searchParams.get("outboundInsurance") === "true";
  const outboundSelectedSeatsParam =
    searchParams.get("outboundSelectedSeats") || "";
  const outboundSelectedSeats = outboundSelectedSeatsParam
    ? outboundSelectedSeatsParam.split(",").filter(Boolean)
    : [];

  const returnExtraBaggage = Number(
    searchParams.get("returnExtraBaggage") || 0
  );
  const returnInsurance = searchParams.get("returnInsurance") === "true";
  const returnSelectedSeatsParam =
    searchParams.get("returnSelectedSeats") || "";
  const returnSelectedSeats = returnSelectedSeatsParam
    ? returnSelectedSeatsParam.split(",").filter(Boolean)
    : [];

  // Combine add-ons for display (use round trip values if available)
  const totalExtraBaggage = isRoundTrip
    ? outboundExtraBaggage + returnExtraBaggage
    : extraBaggage;
  const totalInsurance = isRoundTrip
    ? outboundInsurance || returnInsurance
    : insurance;
  const totalSelectedSeats = isRoundTrip
    ? [...outboundSelectedSeats, ...returnSelectedSeats]
    : selectedSeats;

  // Pricing constants for add-ons
  const EXTRA_BAGGAGE_PRICE = 200000;
  const INSURANCE_PRICE = 150000;
  const PRIORITY_SEAT_PRICE = 100000;

  const [flight, setFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Passenger information
  const [passengers, setPassengers] = useState<FlightPassenger[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Discount information
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<
    PassengerValidationError[]
  >([]);

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
    const currentFlightId = flightId || outboundFlightId;

    if (currentFlightId) {
      setLoading(true);

      // Load outbound flight
      flightService
        .getFlightById(currentFlightId)
        .then((data) => {
          setFlight(data);

          // If round trip, load return flight
          if (isRoundTrip && returnFlightId) {
            return flightService.getFlightById(returnFlightId);
          }
          return null;
        })
        .then((returnData) => {
          if (returnData) {
            setReturnFlight(returnData);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading flight:", err);
          toast.error("Không thể tải thông tin chuyến bay");
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [flightId, outboundFlightId, returnFlightId, isRoundTrip]);

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

  // Calculate seat price based on position (same logic as FlightOptionsModal)
  const getSeatPrice = (seat: string): number => {
    const rowNum = parseInt(seat.match(/\d+/)?.[0] || "0");
    const seatLetter = seat.match(/[A-Z]+/)?.[0] || "";

    // Emergency exit rows (higher price)
    if ([1, 12, 13].includes(rowNum)) {
      return 300000;
    }

    // Front rows
    if (rowNum <= 5) {
      return 200000;
    }

    // Window seats
    if (["A", "F", "K"].includes(seatLetter)) {
      return 150000;
    }

    // Aisle seats
    if (["C", "D", "H", "J"].includes(seatLetter)) {
      return 120000;
    }

    // Middle seats
    return 100000;
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
    const validation = validateFlightPassengers(passengers, adults);
    setValidationErrors(validation.errors);
    if (!validation.isValid) {
      if (validation.errors.length > 0) {
        const firstError = validation.errors[0];
        toast.error(
          `Hành khách ${firstError.index + 1}: ${firstError.message}`
        );
      }
      return;
    }

    const paymentValidation = validatePaymentMethod(paymentMethod);
    if (!paymentValidation.isValid) {
      toast.error(paymentValidation.message);
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

      // Calculate outbound flight price
      const outboundAdultsTotal = adults * baseTicketPrice;
      const outboundChildrenTotal = children * (baseTicketPrice * 0.9);
      const outboundInfantsTotal = infants * (baseTicketPrice * 0.1);
      const outboundFlightPrice =
        outboundAdultsTotal + outboundChildrenTotal + outboundInfantsTotal;

      // Calculate return flight price (if round trip)
      let returnFlightPrice = 0;
      if (isRoundTrip && returnFlight) {
        const returnSelectedClass = returnFlight.classes?.find(
          (c) =>
            c.className.toLowerCase() ===
            (returnSeatClass || seatClass).toLowerCase()
        );
        const returnBaseTicketPrice = returnSelectedClass?.price || 0;

        const returnAdultsTotal = adults * returnBaseTicketPrice;
        const returnChildrenTotal = children * (returnBaseTicketPrice * 0.9);
        const returnInfantsTotal = infants * (returnBaseTicketPrice * 0.1);
        returnFlightPrice =
          returnAdultsTotal + returnChildrenTotal + returnInfantsTotal;
      }

      const totalFlightPrice = outboundFlightPrice + returnFlightPrice;

      // Calculate add-ons separately for each flight
      const outboundBaggageTotal =
        (isRoundTrip ? outboundExtraBaggage : extraBaggage) *
        EXTRA_BAGGAGE_PRICE;
      const outboundInsuranceTotal = (
        isRoundTrip ? outboundInsurance : insurance
      )
        ? numTickets * INSURANCE_PRICE
        : 0;
      const outboundSeatTotal = (
        isRoundTrip ? outboundSelectedSeats : selectedSeats
      ).reduce((total, seat) => total + getSeatPrice(seat), 0);
      const outboundAddOnsTotal =
        outboundBaggageTotal + outboundInsuranceTotal + outboundSeatTotal;

      let returnBaggageTotal = 0;
      let returnInsuranceTotal = 0;
      let returnSeatTotal = 0;
      let returnAddOnsTotal = 0;

      if (isRoundTrip) {
        returnBaggageTotal = returnExtraBaggage * EXTRA_BAGGAGE_PRICE;
        returnInsuranceTotal = returnInsurance
          ? numTickets * INSURANCE_PRICE
          : 0;
        returnSeatTotal = returnSelectedSeats.reduce(
          (total, seat) => total + getSeatPrice(seat),
          0
        );
        returnAddOnsTotal =
          returnBaggageTotal + returnInsuranceTotal + returnSeatTotal;
      }

      const prioritySeatTotal = prioritySeat
        ? numTickets * PRIORITY_SEAT_PRICE
        : 0;
      const totalAddOns =
        outboundAddOnsTotal + returnAddOnsTotal + prioritySeatTotal;

      const subtotalWithAddons = totalFlightPrice + totalAddOns;

      const discountAmount = calculateDiscountAmount(subtotalWithAddons);
      const finalTotal = calculateFinalTotal(subtotalWithAddons);

      // Assign selected seats to passengers (if seats were chosen)
      // For round trip, only assign outbound seats to passengers in this booking
      // Return flight seats will be handled separately
      let passengersWithSeats = passengers.map((p, index) => {
        if (isRoundTrip) {
          // Only assign outbound seats for now
          if (outboundSelectedSeats.length > index) {
            return { ...p, seatNumber: outboundSelectedSeats[index] };
          }
        } else {
          // One-way: assign selected seats normally
          if (selectedSeats.length > index) {
            return { ...p, seatNumber: selectedSeats[index] };
          }
        }
        return p;
      });

      // Prepare note with add-ons information
      let bookingNote = note;
      const addOnsInfo = [];

      if (isRoundTrip) {
        // Round trip add-ons info
        if (outboundExtraBaggage > 0) {
          addOnsInfo.push(
            `Hành lý thêm (Chuyến đi): ${outboundExtraBaggage} kiện (${(
              outboundExtraBaggage * EXTRA_BAGGAGE_PRICE
            ).toLocaleString("vi-VN")} đ)`
          );
        }
        if (returnExtraBaggage > 0) {
          addOnsInfo.push(
            `Hành lý thêm (Chuyến về): ${returnExtraBaggage} kiện (${(
              returnExtraBaggage * EXTRA_BAGGAGE_PRICE
            ).toLocaleString("vi-VN")} đ)`
          );
        }
        if (outboundInsurance) {
          addOnsInfo.push(
            `Bảo hiểm du lịch (Chuyến đi): ${numTickets} người (${outboundInsuranceTotal.toLocaleString(
              "vi-VN"
            )} đ)`
          );
        }
        if (returnInsurance && !outboundInsurance) {
          addOnsInfo.push(
            `Bảo hiểm du lịch (Chuyến về): ${numTickets} người (${returnInsuranceTotal.toLocaleString(
              "vi-VN"
            )} đ)`
          );
        }
        if (outboundSelectedSeats.length > 0) {
          addOnsInfo.push(
            `Ghế ngồi đã chọn (Chuyến đi): ${outboundSelectedSeats.join(
              ", "
            )} (${outboundSeatTotal.toLocaleString("vi-VN")} đ)`
          );
        }
        if (returnSelectedSeats.length > 0) {
          addOnsInfo.push(
            `Ghế ngồi đã chọn (Chuyến về): ${returnSelectedSeats.join(
              ", "
            )} (${returnSeatTotal.toLocaleString("vi-VN")} đ)`
          );
        }
      } else {
        // One-way add-ons info
        if (extraBaggage > 0) {
          addOnsInfo.push(
            `Hành lý thêm: ${extraBaggage} kiện (${outboundBaggageTotal.toLocaleString(
              "vi-VN"
            )} đ)`
          );
        }
        if (insurance) {
          addOnsInfo.push(
            `Bảo hiểm du lịch: ${numTickets} người (${outboundInsuranceTotal.toLocaleString(
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
        if (selectedSeats.length > 0) {
          addOnsInfo.push(
            `Ghế ngồi đã chọn: ${selectedSeats.join(
              ", "
            )} (${outboundSeatTotal.toLocaleString("vi-VN")} đ)`
          );
        }
      }

      if (addOnsInfo.length > 0) {
        bookingNote = `${
          bookingNote ? bookingNote + "\n\n" : ""
        }Dịch vụ bổ sung:\n${addOnsInfo.join("\n")}`;
      }

      // If payment method is MoMo, handle MoMo payment flow
      if (paymentMethod === "momo") {
        try {
          // Prepare extraData with complete booking information
          const momoExtraData: any = {
            flightId: flight._id,
            flightCode: flight.flightCode,
            flightClassId: selectedClass._id,
            numTickets,
            pricePerTicket,
            totalFlightPrice: isRoundTrip
              ? outboundFlightPrice + returnFlightPrice + totalAddOns
              : outboundFlightPrice + outboundAddOnsTotal,
            passengers: passengersWithSeats,
            note: bookingNote,
            discountCode: appliedDiscount?.code,
            discountAmount,
            finalTotal,
            scheduleId: isRoundTrip ? outboundScheduleId : scheduleId
          };

          // Add round trip information
          if (isRoundTrip && returnFlight) {
            const returnSelectedClass = returnFlight.classes?.find(
              (c) =>
                c.className.toLowerCase() ===
                (returnSeatClass || seatClass).toLowerCase()
            );

            const returnPassengers = passengers.map((p, index) => {
              if (returnSelectedSeats.length > index) {
                return { ...p, seatNumber: returnSelectedSeats[index] };
              }
              return p;
            });

            momoExtraData.isRoundTrip = true;
            momoExtraData.returnFlightId = returnFlight._id;
            momoExtraData.returnFlightCode = returnFlight.flightCode;
            momoExtraData.returnFlightClassId = returnSelectedClass?._id;
            momoExtraData.returnScheduleId = returnScheduleId;
            momoExtraData.returnPassengers = returnPassengers;
            momoExtraData.outboundFlightPrice =
              outboundFlightPrice + outboundAddOnsTotal;
            momoExtraData.returnFlightPrice =
              returnFlightPrice + returnAddOnsTotal;
          }

          const momoResponse = await paymentService.createMoMoPayment({
            amount: finalTotal,
            orderInfo: `Thanh toán vé máy bay: ${flight.flightCode}${
              isRoundTrip ? ` - ${returnFlight?.flightCode}` : ""
            }`,
            extraData: JSON.stringify(momoExtraData)
          });

          if (momoResponse.success && momoResponse.data?.payUrl) {
            // Save complete booking data to localStorage
            const bookingData: any = {
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice: isRoundTrip
                ? outboundFlightPrice + returnFlightPrice + totalAddOns
                : outboundFlightPrice + outboundAddOnsTotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers: passengersWithSeats,
              note: bookingNote,
              paymentMethod,
              momoOrderId: momoResponse.data.orderId,
              scheduleId: isRoundTrip ? outboundScheduleId : scheduleId
            };

            // Add round trip information
            if (isRoundTrip && returnFlight) {
              const returnSelectedClass = returnFlight.classes?.find(
                (c) =>
                  c.className.toLowerCase() ===
                  (returnSeatClass || seatClass).toLowerCase()
              );

              const returnPassengers = passengers.map((p, index) => {
                if (returnSelectedSeats.length > index) {
                  return { ...p, seatNumber: returnSelectedSeats[index] };
                }
                return p;
              });

              bookingData.isRoundTrip = true;
              bookingData.returnFlightId = returnFlight._id;
              bookingData.returnFlightCode = returnFlight.flightCode;
              bookingData.returnFlightClassId = returnSelectedClass?._id;
              bookingData.returnScheduleId = returnScheduleId;
              bookingData.returnPassengers = returnPassengers;
              bookingData.outboundFlightPrice =
                outboundFlightPrice + outboundAddOnsTotal;
              bookingData.returnFlightPrice =
                returnFlightPrice + returnAddOnsTotal;
            }

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
          // Prepare extraData with complete booking information
          const zalopayExtraData: any = {
            flightId: flight._id,
            flightCode: flight.flightCode,
            flightClassId: selectedClass._id,
            numTickets,
            pricePerTicket,
            totalFlightPrice: isRoundTrip
              ? outboundFlightPrice + returnFlightPrice + totalAddOns
              : outboundFlightPrice + outboundAddOnsTotal,
            passengers: passengersWithSeats,
            note: bookingNote,
            discountCode: appliedDiscount?.code,
            discountAmount,
            finalTotal,
            scheduleId: isRoundTrip ? outboundScheduleId : scheduleId
          };

          // Add round trip information
          if (isRoundTrip && returnFlight) {
            const returnSelectedClass = returnFlight.classes?.find(
              (c) =>
                c.className.toLowerCase() ===
                (returnSeatClass || seatClass).toLowerCase()
            );

            const returnPassengers = passengers.map((p, index) => {
              if (returnSelectedSeats.length > index) {
                return { ...p, seatNumber: returnSelectedSeats[index] };
              }
              return p;
            });

            zalopayExtraData.isRoundTrip = true;
            zalopayExtraData.returnFlightId = returnFlight._id;
            zalopayExtraData.returnFlightCode = returnFlight.flightCode;
            zalopayExtraData.returnFlightClassId = returnSelectedClass?._id;
            zalopayExtraData.returnScheduleId = returnScheduleId;
            zalopayExtraData.returnPassengers = returnPassengers;
            zalopayExtraData.outboundFlightPrice =
              outboundFlightPrice + outboundAddOnsTotal;
            zalopayExtraData.returnFlightPrice =
              returnFlightPrice + returnAddOnsTotal;
          }

          const zalopayResponse = await paymentService.createZaloPayPayment({
            amount: finalTotal,
            description: `Thanh toán vé máy bay: ${flight.flightCode}${
              isRoundTrip ? ` - ${returnFlight?.flightCode}` : ""
            }`,
            extraData: JSON.stringify(zalopayExtraData)
          });

          if (zalopayResponse.success && zalopayResponse.data?.order_url) {
            // Save complete booking data to localStorage
            const bookingData: any = {
              flightId: flight._id,
              flightCode: flight.flightCode,
              flightClassId: selectedClass._id,
              numTickets,
              pricePerTicket,
              totalFlightPrice: isRoundTrip
                ? outboundFlightPrice + returnFlightPrice + totalAddOns
                : outboundFlightPrice + outboundAddOnsTotal,
              discountAmount,
              finalTotal,
              discountCode: appliedDiscount?.code,
              status: "pending",
              passengers: passengersWithSeats,
              note: bookingNote,
              paymentMethod,
              zalopayTransId: zalopayResponse.data.app_trans_id,
              scheduleId: isRoundTrip ? outboundScheduleId : scheduleId
            };

            // Add round trip information
            if (isRoundTrip && returnFlight) {
              const returnSelectedClass = returnFlight.classes?.find(
                (c) =>
                  c.className.toLowerCase() ===
                  (returnSeatClass || seatClass).toLowerCase()
              );

              const returnPassengers = passengers.map((p, index) => {
                if (returnSelectedSeats.length > index) {
                  return { ...p, seatNumber: returnSelectedSeats[index] };
                }
                return p;
              });

              bookingData.isRoundTrip = true;
              bookingData.returnFlightId = returnFlight._id;
              bookingData.returnFlightCode = returnFlight.flightCode;
              bookingData.returnFlightClassId = returnSelectedClass?._id;
              bookingData.returnScheduleId = returnScheduleId;
              bookingData.returnPassengers = returnPassengers;
              bookingData.outboundFlightPrice =
                outboundFlightPrice + outboundAddOnsTotal;
              bookingData.returnFlightPrice =
                returnFlightPrice + returnAddOnsTotal;
            }

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
      const bookingPayload: any = {
        flightId: flight._id,
        flightCode: flight.flightCode,
        flightClassId: selectedClass._id,
        numTickets,
        pricePerTicket,
        totalFlightPrice: isRoundTrip
          ? outboundFlightPrice + returnFlightPrice + totalAddOns
          : outboundFlightPrice + outboundAddOnsTotal,
        discountAmount,
        finalTotal,
        discountCode: appliedDiscount?.code,
        status: "pending",
        passengers: passengersWithSeats as any,
        note: bookingNote,
        paymentMethod,
        scheduleId: isRoundTrip ? outboundScheduleId : scheduleId
      };

      // Add round trip information if applicable
      if (isRoundTrip && returnFlight) {
        const returnSelectedClass = returnFlight.classes?.find(
          (c) =>
            c.className.toLowerCase() ===
            (returnSeatClass || seatClass).toLowerCase()
        );

        // Create return passengers with return flight seats
        const returnPassengers = passengers.map((p, index) => {
          if (returnSelectedSeats.length > index) {
            return { ...p, seatNumber: returnSelectedSeats[index] };
          }
          return p;
        });

        bookingPayload.isRoundTrip = true;
        bookingPayload.returnFlightId = returnFlight._id;
        bookingPayload.returnFlightCode = returnFlight.flightCode;
        bookingPayload.returnFlightClassId = returnSelectedClass?._id;
        bookingPayload.returnScheduleId = returnScheduleId;
        bookingPayload.returnPassengers = returnPassengers;
        bookingPayload.outboundFlightPrice =
          outboundFlightPrice + outboundAddOnsTotal;
        bookingPayload.returnFlightPrice =
          returnFlightPrice + returnAddOnsTotal;
      }

      console.log("🛫 Booking Payload:", {
        isRoundTrip,
        outboundSeats: passengersWithSeats
          .map((p) => p.seatNumber)
          .filter(Boolean),
        returnSeats: bookingPayload.returnPassengers
          ?.map((p: any) => p.seatNumber)
          .filter(Boolean),
        scheduleId: bookingPayload.scheduleId,
        returnScheduleId: bookingPayload.returnScheduleId
      });

      const res = await bookingFlightService.createBookingFlight(
        bookingPayload
      );

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

  // For round trip, calculate return flight price
  let returnBaseTicketPrice = 0;
  if (isRoundTrip && returnFlight) {
    const returnSelectedClass = returnFlight.classes?.find(
      (c) =>
        c.className.toLowerCase() ===
        (returnSeatClass || seatClass).toLowerCase()
    );
    returnBaseTicketPrice = returnSelectedClass?.price || 0;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />
      <div className="py-8 mt-16 sm:mt-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold mb-2">
                {isRoundTrip ? (
                  <>
                    Đặt vé máy bay khứ hồi
                    <div className="text-lg font-normal mt-2">
                      <div>Chuyến đi: {flight.flightCode}</div>
                      {returnFlight && (
                        <div>Chuyến về: {returnFlight.flightCode}</div>
                      )}
                    </div>
                  </>
                ) : (
                  `Đặt vé máy bay: ${flight.flightCode}`
                )}
              </h1>
              <div className="flex items-center text-blue-100">
                <span className="mr-4 flex items-center gap-1">
                  <Users className="w-4 h-4" /> {adults + children + infants}{" "}
                  hành khách
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Tổng:{" "}
                  {(() => {
                    const outboundAdultsTotal = adults * baseTicketPrice;
                    const outboundChildrenTotal =
                      children * (baseTicketPrice * 0.9);
                    const outboundInfantsTotal =
                      infants * (baseTicketPrice * 0.1);
                    const outboundFlightPrice =
                      outboundAdultsTotal +
                      outboundChildrenTotal +
                      outboundInfantsTotal;

                    let returnFlightPrice = 0;
                    if (isRoundTrip && returnBaseTicketPrice > 0) {
                      const returnAdultsTotal = adults * returnBaseTicketPrice;
                      const returnChildrenTotal =
                        children * (returnBaseTicketPrice * 0.9);
                      const returnInfantsTotal =
                        infants * (returnBaseTicketPrice * 0.1);
                      returnFlightPrice =
                        returnAdultsTotal +
                        returnChildrenTotal +
                        returnInfantsTotal;
                    }

                    const totalFlightPrice =
                      outboundFlightPrice + returnFlightPrice;
                    const numTickets = adults + children + infants;
                    const baggageTotal =
                      totalExtraBaggage * EXTRA_BAGGAGE_PRICE;
                    const insuranceTotal = totalInsurance
                      ? numTickets * INSURANCE_PRICE
                      : 0;
                    const prioritySeatTotal = prioritySeat
                      ? numTickets * PRIORITY_SEAT_PRICE
                      : 0;
                    const seatTotal = totalSelectedSeats.reduce(
                      (total, seat) => total + getSeatPrice(seat),
                      0
                    );
                    const addOnsTotal =
                      baggageTotal +
                      insuranceTotal +
                      prioritySeatTotal +
                      seatTotal;
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
                returnBaseTicketPrice={isRoundTrip ? returnBaseTicketPrice : 0}
                isRoundTrip={isRoundTrip}
                extraBaggage={extraBaggage}
                insurance={insurance}
                prioritySeat={prioritySeat}
                outboundExtraBaggage={
                  isRoundTrip ? outboundExtraBaggage : undefined
                }
                outboundInsurance={isRoundTrip ? outboundInsurance : undefined}
                outboundSelectedSeats={
                  isRoundTrip ? outboundSelectedSeats : undefined
                }
                returnExtraBaggage={
                  isRoundTrip ? returnExtraBaggage : undefined
                }
                returnInsurance={isRoundTrip ? returnInsurance : undefined}
                returnSelectedSeats={
                  isRoundTrip ? returnSelectedSeats : undefined
                }
                selectedSeats={!isRoundTrip ? selectedSeats : undefined}
                EXTRA_BAGGAGE_PRICE={EXTRA_BAGGAGE_PRICE}
                INSURANCE_PRICE={INSURANCE_PRICE}
                PRIORITY_SEAT_PRICE={PRIORITY_SEAT_PRICE}
                appliedDiscount={appliedDiscount}
                calculateDiscountAmount={calculateDiscountAmount}
                getSeatPrice={getSeatPrice}
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
