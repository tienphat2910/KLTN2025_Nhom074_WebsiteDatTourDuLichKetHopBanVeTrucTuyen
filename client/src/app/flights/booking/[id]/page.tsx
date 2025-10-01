"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService";
import { bookingFlightService, PassengerInfo as FlightPassengerInfo } from "@/services/bookingFlightService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function BookingFlightPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user, isAuthLoading } = useAuth();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [classType, setClassType] = useState<'economy' | 'business'>('economy');
  const [passengers, setPassengers] = useState<FlightPassengerInfo[]>([]);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const bookingRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!id) return;
    const fetchFlight = async () => {
      try {
        const data = await flightService.getFlightById(id as string);
        setFlight(data);
      } catch (err) {
        setError("Không tìm thấy chuyến bay");
      } finally {
        setLoading(false);
      }
    };
    fetchFlight();
  }, [id]);

  useEffect(() => {
    const list: FlightPassengerInfo[] = [];
    for (let i = 0; i < adults; i++) {
      list.push({
        fullName: i === 0 && user?.fullName ? user.fullName : "",
        phone: i === 0 && user?.phone ? user.phone : undefined,
        email: i === 0 && user?.email ? user.email : undefined,
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "adult"
      });
    }
    for (let i = 0; i < children; i++) {
      list.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "child"
      } as any);
    }
    for (let i = 0; i < infants; i++) {
      list.push({
        fullName: "",
        gender: "",
        dateOfBirth: "",
        cccd: "",
        type: "infant"
      } as any);
    }
    setPassengers(list);
  }, [adults, children, infants, user]);

  const updatePassenger = (index: number, field: keyof FlightPassengerInfo, value: string) => {
    setPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const getPassengerTypeLabel = (type: "adult" | "child" | "infant") => {
    switch (type) {
      case "adult": return "Người lớn";
      case "child": return "Trẻ em";
      case "infant": return "Em bé";
      default: return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để đặt vé!");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const hasEmptyFields = passengers.some((passenger, index) => {
      if (index === 0) {
        return !passenger.fullName.trim() || !passenger.phone?.trim() || !passenger.email?.trim() || !passenger.gender.trim() || !passenger.dateOfBirth.trim();
      }
      return !passenger.fullName.trim() || !passenger.gender.trim() || !passenger.dateOfBirth.trim();
    });
    if (hasEmptyFields) {
      toast.error("Vui lòng nhập đầy đủ thông tin tất cả hành khách!");
      return;
    }
    if (!paymentMethod) {
      toast.error("Vui lòng chọn hình thức thanh toán!");
      return;
    }
    if (!flight) {
      toast.error("Không tìm thấy thông tin chuyến bay.");
      return;
    }
    setSubmitting(true);
    try {
      const priceByClass = {
        economy: flight.seatInfo?.classes?.economy?.price || 0,
        business: flight.seatInfo?.classes?.business?.price || 0
      };
      const subtotal =
        classType === 'economy'
          ? adults * priceByClass.economy + children * priceByClass.economy + infants * priceByClass.economy
          : adults * priceByClass.business + children * priceByClass.business + infants * priceByClass.business;
      const res = await bookingFlightService.createBookingFlight({
        flightId: flight._id,
        numAdults: adults,
        numChildren: children,
        numInfants: infants,
        priceByClass,
        classType,
        subtotal,
        status: "pending",
        passengers,
        note,
        paymentMethod
      });
      if (res.success) {
        toast.success("Đặt vé thành công!");
        router.push("/profile/bookings");
      } else {
        if (res.requireAuth) {
          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        } else {
          toast.error(res.message || "Đặt vé thất bại!");
        }
      }
    } catch (err) {
      toast.error("Lỗi kết nối server!");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 flex items-center justify-center">
        <span>Đang tải thông tin chuyến bay...</span>
      </div>
    );
  }
  if (error || !flight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 flex flex-col items-center justify-center">
        <Header />
        <div className="container mx-auto px-4 pt-24 pb-16 text-center">
          <div className="text-6xl mb-4">🛫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy chuyến bay</h1>
          <p className="text-gray-600 mb-8">Chuyến bay bạn đang tìm kiếm có thể đã bị xóa hoặc không tồn tại.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col gap-6 animate-fade-in">
            {/* Thông tin chuyến bay tóm tắt */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sky-600 text-2xl">🛫</span>
                <span className="font-semibold text-gray-700 text-lg">{flight.departureAirport.city} ({flight.departureAirport.code})</span>
                <span className="mx-2 text-gray-400">→</span>
                <span className="text-sky-600 text-2xl">🛬</span>
                <span className="font-semibold text-gray-700 text-lg">{flight.arrivalAirport.city} ({flight.arrivalAirport.code})</span>
              </div>
              <div className="flex flex-wrap gap-4 text-gray-600 text-sm md:text-base mb-2">
                <div className="flex items-center gap-1">
                  <span>Ngày đi: {formatDate(flight.departureTime)} {formatTime(flight.departureTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Ngày đến: {formatDate(flight.arrivalTime)} {formatTime(flight.arrivalTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Thời lượng: {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Máy bay: {flight.aircraft?.model || "Đang cập nhật"}</span>
                </div>
              </div>
            </div>
            {/* Form đặt vé máy bay */}
            <form ref={bookingRef} onSubmit={handleSubmit} className="mt-8 border-t pt-8">
              <button type="button" onClick={() => router.push("/flights")} className="mb-4 inline-flex items-center px-4 py-2 bg-white border border-sky-500 text-sky-600 font-semibold rounded-lg hover:bg-sky-50 transition-all duration-300">
                ← Quay lại danh sách chuyến bay
              </button>
              <h2 className="text-2xl font-bold mb-4 text-blue-700">Đặt vé máy bay</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block font-semibold mb-1">Người lớn</label>
                  <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Trẻ em</label>
                  <input type="number" min={0} value={children} onChange={e => setChildren(Number(e.target.value))} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Em bé</label>
                  <input type="number" min={0} value={infants} onChange={e => setInfants(Number(e.target.value))} className="border p-2 w-full rounded" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-semibold mb-1">Hạng vé</label>
                <select value={classType} onChange={e => setClassType(e.target.value as any)} className="border p-2 w-full rounded">
                  <option value="economy">Phổ thông ({flight?.seatInfo?.classes?.economy?.price?.toLocaleString("vi-VN")} đ)</option>
                  <option value="business">Thương gia ({flight?.seatInfo?.classes?.business?.price?.toLocaleString("vi-VN")} đ)</option>
                </select>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Thông tin hành khách</h3>
                <div className="space-y-6">
                  {passengers.map((passenger, index) => {
                    const isContactPerson = index === 0;
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {getPassengerTypeLabel(passenger.type)} {index + 1}
                          </span>
                          {isContactPerson && <span className="ml-2 text-xs text-gray-500">(Người liên hệ)</span>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">Họ và tên *</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.fullName} onChange={e => updatePassenger(index, "fullName", e.target.value)} required />
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">Giới tính *</label>
                            <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.gender} onChange={e => updatePassenger(index, "gender", e.target.value)} required>
                              <option value="">Chọn giới tính</option>
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                            </select>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">Ngày sinh *</label>
                            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.dateOfBirth} onChange={e => updatePassenger(index, "dateOfBirth", e.target.value)} required />
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block font-semibold mb-1 text-gray-700">CCCD/CMND</label>
                            <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.cccd || ""} onChange={e => updatePassenger(index, "cccd", e.target.value)} placeholder="Nhập số CCCD/CMND" />
                          </div>
                          {isContactPerson && (
                            <div className="lg:col-span-2">
                              <label className="block font-semibold mb-1 text-gray-700">Số điện thoại *</label>
                              <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.phone || ""} onChange={e => updatePassenger(index, "phone", e.target.value)} required />
                            </div>
                          )}
                          {isContactPerson && (
                            <div className="lg:col-span-2">
                              <label className="block font-semibold mb-1 text-gray-700">Email *</label>
                              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={passenger.email || ""} onChange={e => updatePassenger(index, "email", e.target.value)} required />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Hình thức thanh toán</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "cash" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`} onClick={() => setPaymentMethod("cash")}> <input type="radio" id="cash" name="paymentMethod" value="cash" checked={paymentMethod === "cash"} onChange={e => setPaymentMethod(e.target.value)} className="mr-3 text-blue-600" /> <label htmlFor="cash" className="font-semibold text-gray-800 cursor-pointer">💵 Tiền mặt</label> <p className="text-sm text-gray-600 ml-8">Thanh toán bằng tiền mặt khi gặp nhân viên</p> </div>
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "momo" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`} onClick={() => setPaymentMethod("momo")}> <input type="radio" id="momo" name="paymentMethod" value="momo" checked={paymentMethod === "momo"} onChange={e => setPaymentMethod(e.target.value)} className="mr-3 text-blue-600" /> <label htmlFor="momo" className="font-semibold text-gray-800 cursor-pointer">M MoMo</label> <p className="text-sm text-gray-600 ml-8">Thanh toán qua ví điện tử MoMo</p> </div>
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === "bank_transfer" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`} onClick={() => setPaymentMethod("bank_transfer")}> <input type="radio" id="bank_transfer" name="paymentMethod" value="bank_transfer" checked={paymentMethod === "bank_transfer"} onChange={e => setPaymentMethod(e.target.value)} className="mr-3 text-blue-600" /> <label htmlFor="bank_transfer" className="font-semibold text-gray-800 cursor-pointer">🏦 Chuyển khoản</label> <p className="text-sm text-gray-600 ml-8">Chuyển khoản ngân hàng</p> </div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block font-semibold mb-2 text-gray-700">Yêu cầu đặc biệt (không bắt buộc)</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Nhập yêu cầu đặc biệt của bạn..." />
              </div>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Chi tiết đặt vé</h3>
                <div className="space-y-2 text-sm text-black">
                  <div className="flex justify-between"><span>Hạng vé:</span><span className="font-medium">{classType === 'economy' ? 'Phổ thông' : 'Thương gia'}</span></div>
                  <div className="flex justify-between"><span>Người lớn:</span><span className="font-medium">{adults}</span></div>
                  <div className="flex justify-between"><span>Trẻ em:</span><span className="font-medium">{children}</span></div>
                  <div className="flex justify-between"><span>Em bé:</span><span className="font-medium">{infants}</span></div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-600"><span>Tổng tiền:</span><span>{(() => { const price = classType === 'economy' ? flight?.seatInfo?.classes?.economy?.price || 0 : flight?.seatInfo?.classes?.business?.price || 0; return ((adults + children + infants) * price).toLocaleString('vi-VN'); })()} đ</span></div>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-lg">{submitting ? <span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Đang xử lý...</span> : "Xác nhận đặt vé"}</button>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
