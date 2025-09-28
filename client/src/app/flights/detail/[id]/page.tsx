"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Flight, flightService } from "@/services/flightService";
import LoadingSpinner from "@/components/Loading/LoadingSpinner";
import Link from "next/link";

export default function FlightDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState<Partial<Flight> | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

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
    if (flight) setEditData(flight);
  }, [flight]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editData) return;
    const { name, value } = e.target;
    // Nested fields
    if (name.startsWith("departureAirport.")) {
      setEditData({
        ...editData,
        departureAirport: {
          ...editData.departureAirport,
          [name.split(".")[1]]: value,
        },
      });
    } else if (name.startsWith("arrivalAirport.")) {
      setEditData({
        ...editData,
        arrivalAirport: {
          ...editData.arrivalAirport,
          [name.split(".")[1]]: value,
        },
      });
    } else if (name.startsWith("aircraft.")) {
      setEditData({
        ...editData,
        aircraft: {
          ...editData.aircraft,
          [name.split(".")[1]]: value,
        },
      });
    } else if (name.startsWith("seatInfo.classes.")) {
      const [_, __, cls, field] = name.split(".");
      setEditData({
        ...editData,
        seatInfo: {
          ...editData.seatInfo,
          classes: {
            ...editData.seatInfo?.classes,
            [cls]: {
              ...editData.seatInfo?.classes?.[cls],
              [field]: value,
            },
          },
        },
      });
    } else {
      setEditData({ ...editData, [name]: value });
    }
  };

  const handleUpdateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData || !flight) return;
    setIsUpdating(true);
    setUpdateMessage(null);
    try {
      const payload: any = { ...editData };
      if (payload.durationMinutes !== undefined) {
        payload.durationMinutes = Number(payload.durationMinutes);
      }
      if (payload.seatInfo?.classes?.economy?.price !== undefined) {
        payload.seatInfo.classes.economy.price = Number(payload.seatInfo.classes.economy.price);
      }
      if (payload.seatInfo?.classes?.business?.price !== undefined) {
        payload.seatInfo.classes.business.price = Number(payload.seatInfo.classes.business.price);
      }
      if (payload.seatInfo?.classes?.economy?.available !== undefined) {
        payload.seatInfo.classes.economy.available = Number(payload.seatInfo.classes.economy.available);
      }
      if (payload.seatInfo?.classes?.business?.available !== undefined) {
        payload.seatInfo.classes.business.available = Number(payload.seatInfo.classes.business.available);
      }

      // Datetime-local -> ISO
      if (typeof payload.departureTime === 'string' && payload.departureTime.length <= 16) {
        payload.departureTime = new Date(payload.departureTime).toISOString();
      }
      if (typeof payload.arrivalTime === 'string' && payload.arrivalTime.length <= 16) {
        payload.arrivalTime = new Date(payload.arrivalTime).toISOString();
      }

      const updated = await flightService.updateFlight(flight._id, payload);
      setFlight(updated);
      setShowEditForm(false);
      setUpdateMessage("Cập nhật thành công!");
    } catch (err: any) {
      setUpdateMessage("Cập nhật thất bại: " + (err?.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
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
        <LoadingSpinner type="plane" size="xl" text="Đang tải thông tin chuyến bay..." />
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
          <Link href="/flights" className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-300 inline-block">
            ← Quay lại danh sách chuyến bay
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100">
      <Header />
      {/* Hero section */}
      <div className="relative h-56 md:h-72 lg:h-80 w-full flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/banner-flight.webp')", filter: "brightness(0.4)" }}></div>
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/60 via-blue-900/40 to-indigo-900/60"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl md:text-6xl mb-2">✈️</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-xl mb-2">Chi tiết chuyến bay</h1>
            <div className="text-lg md:text-xl text-white/90 font-medium drop-shadow-lg">
              {flight.flightNumber} • {flight.airline}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sky-600 text-2xl">🛫</span>
                  <span className="font-semibold text-gray-700 text-lg">{flight.departureAirport.city} ({flight.departureAirport.code})</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-sky-600 text-2xl">🛬</span>
                  <span className="font-semibold text-gray-700 text-lg">{flight.arrivalAirport.city} ({flight.arrivalAirport.code})</span>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600 text-sm md:text-base mb-2">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Ngày đi: {formatDate(flight.departureTime)} {formatTime(flight.departureTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Ngày đến: {formatDate(flight.arrivalTime)} {formatTime(flight.arrivalTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Thời lượng: {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Máy bay: {flight.aircraft?.model || "Đang cập nhật"}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-gray-600 text-sm md:text-base">
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Trạng thái: <span className="font-semibold text-sky-700">{flight.status}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 min-w-[180px]">
                <div className="text-right">
                  <div className="text-gray-500 text-sm">Giá phổ thông</div>
                  <div className="text-2xl font-bold text-sky-600">
                    {flight.seatInfo?.classes?.economy?.price?.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-gray-500 text-xs">Còn {flight.seatInfo?.classes?.economy?.available} ghế</div>
                </div>
                <div className="text-right mt-2">
                  <div className="text-gray-500 text-sm">Giá thương gia</div>
                  <div className="text-xl font-bold text-amber-600">
                    {flight.seatInfo?.classes?.business?.price?.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-gray-500 text-xs">Còn {flight.seatInfo?.classes?.business?.available} ghế</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <button
                className="w-full md:w-auto bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-base md:text-lg"
                disabled={flight.seatInfo?.availableSeats === 0}
              >
                {flight.seatInfo?.availableSeats === 0 ? "Hết chỗ" : "Đặt vé ngay"}
              </button>
              <button
                className="w-full md:w-auto bg-white border border-sky-500 text-sky-600 font-semibold py-3 px-8 rounded-lg hover:bg-sky-50 transition-all duration-300 text-base md:text-lg"
                onClick={() => router.push("/flights")}
              >
                ← Quay lại danh sách
              </button>
              <button
                className="w-full md:w-auto bg-yellow-100 border border-yellow-400 text-yellow-700 font-semibold py-3 px-8 rounded-lg hover:bg-yellow-200 transition-all duration-300 text-base md:text-lg"
                onClick={() => setShowEditForm((v) => !v)}
              >
                {showEditForm ? "Đóng sửa" : "Sửa thông tin"}
              </button>
            </div>
            {updateMessage && (
              <div className={`text-center font-semibold ${updateMessage.includes("thành công") ? "text-green-600" : "text-red-600"}`}>{updateMessage}</div>
            )}
            {showEditForm && editData && (
              <form onSubmit={handleUpdateFlight} className="bg-blue-50 rounded-xl p-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Hãng</label>
                  <input name="airline" value={editData.airline || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mã chuyến bay</label>
                  <input name="flightNumber" value={editData.flightNumber || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Thành phố đi</label>
                  <input name="departureAirport.city" value={editData.departureAirport?.city || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mã sân bay đi</label>
                  <input name="departureAirport.code" value={editData.departureAirport?.code || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Thành phố đến</label>
                  <input name="arrivalAirport.city" value={editData.arrivalAirport?.city || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mã sân bay đến</label>
                  <input name="arrivalAirport.code" value={editData.arrivalAirport?.code || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Giờ khởi hành</label>
                  <input name="departureTime" type="datetime-local" value={editData.departureTime ? new Date(editData.departureTime).toISOString().slice(0,16) : ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Giờ đến</label>
                  <input name="arrivalTime" type="datetime-local" value={editData.arrivalTime ? new Date(editData.arrivalTime).toISOString().slice(0,16) : ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Thời lượng (phút)</label>
                  <input name="durationMinutes" type="number" value={editData.durationMinutes || 0} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Loại máy bay</label>
                  <input name="aircraft.model" value={editData.aircraft?.model || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Trạng thái</label>
                  <input name="status" value={editData.status || ""} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Giá phổ thông</label>
                  <input name="seatInfo.classes.economy.price" type="number" value={editData.seatInfo?.classes?.economy?.price || 0} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Số ghế phổ thông còn</label>
                  <input name="seatInfo.classes.economy.available" type="number" value={editData.seatInfo?.classes?.economy?.available || 0} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Giá thương gia</label>
                  <input name="seatInfo.classes.business.price" type="number" value={editData.seatInfo?.classes?.business?.price || 0} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Số ghế thương gia còn</label>
                  <input name="seatInfo.classes.business.available" type="number" value={editData.seatInfo?.classes?.business?.available || 0} onChange={handleEditChange} className="border p-2 w-full rounded" />
                </div>
                <div className="col-span-2 flex gap-2 mt-2">
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={isUpdating}>
                    {isUpdating ? "Đang cập nhật..." : "Lưu thay đổi"}
                  </button>
                  <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500" onClick={() => setShowEditForm(false)}>
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
