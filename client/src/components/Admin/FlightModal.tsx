"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plane, Plus, Trash2, Calendar, Search } from "lucide-react";
import { env } from "@/config/env";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface FlightClass {
  className: string;
  basePrice: number;
  availableSeats: number;
}

interface FlightModalProps {
  flight?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FlightModal({
  flight,
  onClose,
  onSuccess
}: FlightModalProps) {
  const [loading, setLoading] = useState(false);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [departureSearch, setDepartureSearch] = useState("");
  const [arrivalSearch, setArrivalSearch] = useState("");

  const [formData, setFormData] = useState({
    flightCode: flight?.flightCode || "",
    airlineId: flight?.airlineId?._id || "",
    departureAirportId: flight?.departureAirportId?._id || "",
    arrivalAirportId: flight?.arrivalAirportId?._id || "",
    departureTime: flight?.departureTime
      ? new Date(flight.departureTime).toISOString().slice(0, 16)
      : "",
    arrivalTime: flight?.arrivalTime
      ? new Date(flight.arrivalTime).toISOString().slice(0, 16)
      : "",
    durationMinutes: flight?.durationMinutes || 0,
    basePrice: flight?.basePrice || 0,
    status: flight?.status || "active",
    aircraftModel: flight?.aircraft?.model || "",
    aircraftRegistration: flight?.aircraft?.registration || ""
  });

  const [flightClasses, setFlightClasses] = useState<FlightClass[]>([
    { className: "Economy", basePrice: 0, availableSeats: 0 }
  ]);

  const [autoGenerateSchedules, setAutoGenerateSchedules] = useState(false);
  const [scheduleDays, setScheduleDays] = useState(7);

  useEffect(() => {
    fetchAirlines();
    fetchAirports();
    if (flight?._id) {
      fetchFlightClasses();
    }
  }, []);

  const fetchFlightClasses = async () => {
    try {
      const token = localStorage.getItem("lutrip_admin_token");
      const response = await fetch(
        `${env.API_BASE_URL}/flight-classes?flightCode=${flight.flightCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setFlightClasses(
          data.map((fc: any) => ({
            className: fc.className,
            basePrice: fc.price,
            availableSeats: fc.availableSeats
          }))
        );
      } else if (
        data.success &&
        Array.isArray(data.data) &&
        data.data.length > 0
      ) {
        setFlightClasses(
          data.data.map((fc: any) => ({
            className: fc.className,
            basePrice: fc.price,
            availableSeats: fc.availableSeats
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching flight classes:", error);
    }
  };

  const fetchAirlines = async () => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/airlines`);
      const data = await response.json();
      if (data.success) {
        setAirlines(data.data);
      }
    } catch (error) {
      console.error("Error fetching airlines:", error);
    }
  };

  const fetchAirports = async () => {
    try {
      const response = await fetch(`${env.API_BASE_URL}/airports`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAirports(data);
      } else if (data.success && Array.isArray(data.data)) {
        setAirports(data.data);
      }
    } catch (error) {
      console.error("Error fetching airports:", error);
    }
  };

  const addFlightClass = () => {
    setFlightClasses([
      ...flightClasses,
      { className: "", basePrice: 0, availableSeats: 0 }
    ]);
  };

  const removeFlightClass = (index: number) => {
    if (flightClasses.length > 1) {
      setFlightClasses(flightClasses.filter((_, i) => i !== index));
    }
  };

  const updateFlightClass = (
    index: number,
    field: keyof FlightClass,
    value: any
  ) => {
    const updated = [...flightClasses];
    updated[index] = { ...updated[index], [field]: value };
    setFlightClasses(updated);
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\D/g, "")) || 0;
  };

  const calculateDuration = (departureTime: string, arrivalTime: string) => {
    if (!departureTime || !arrivalTime) return 0;

    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);

    if (arrival <= departure) return 0;

    const diffMs = arrival.getTime() - departure.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    return diffMinutes;
  };

  const handleTimeChange = (
    field: "departureTime" | "arrivalTime",
    value: string
  ) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate duration
    if (field === "departureTime" && formData.arrivalTime) {
      newFormData.durationMinutes = calculateDuration(
        value,
        formData.arrivalTime
      );
    } else if (field === "arrivalTime" && formData.departureTime) {
      newFormData.durationMinutes = calculateDuration(
        formData.departureTime,
        value
      );
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate flight classes
    if (flightClasses.some((fc) => !fc.className || fc.availableSeats <= 0)) {
      toast.error("Vui lòng điền đầy đủ thông tin hạng ghế");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("lutrip_admin_token");

      // Calculate total available seats
      const totalSeats = flightClasses.reduce(
        (sum, fc) => sum + fc.availableSeats,
        0
      );

      const payload = {
        ...formData,
        availableSeats: totalSeats,
        aircraft: {
          model: formData.aircraftModel,
          registration: formData.aircraftRegistration
        }
      };

      // First create/update the flight
      const flightUrl = flight
        ? `${env.API_BASE_URL}/flights/${flight._id}`
        : `${env.API_BASE_URL}/flights`;

      const flightResponse = await fetch(flightUrl, {
        method: flight ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const flightData = await flightResponse.json();

      if (!flightData.success) {
        toast.error(flightData.message || "Có lỗi xảy ra");
        setLoading(false);
        return;
      }

      const flightId = flight?._id || flightData.data?._id;
      const flightCode =
        flight?.flightCode ||
        flightData.data?.flightCode ||
        formData.flightCode;

      // Then create/update flight classes
      if (flightId && flightCode) {
        await Promise.all(
          flightClasses.map(async (fc) => {
            const classPayload = {
              flightCode: flightCode,
              className: fc.className,
              price: fc.basePrice,
              baggageAllowance:
                fc.className === "Business"
                  ? 30
                  : fc.className === "Premium Economy"
                  ? 23
                  : 20,
              cabinBaggage: fc.className === "Business" ? 10 : 7,
              availableSeats: fc.availableSeats,
              amenities:
                fc.className === "Business"
                  ? ["Meals", "WiFi", "Entertainment", "Lounge Access"]
                  : fc.className === "Premium Economy"
                  ? ["Meals", "WiFi", "Entertainment"]
                  : ["Meals"]
            };

            const response = await fetch(`${env.API_BASE_URL}/flight-classes`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(classPayload)
            });

            if (!response.ok) {
              console.error(
                "Error creating flight class:",
                await response.text()
              );
            }
          })
        );

        // Auto-generate flight schedules if enabled
        if (autoGenerateSchedules && !flight && flightCode) {
          const schedules = [];
          const baseDate = new Date(formData.departureTime);

          for (let i = 0; i < scheduleDays; i++) {
            const scheduleDate = new Date(baseDate);
            scheduleDate.setDate(baseDate.getDate() + i);

            const scheduleDepartureTime = new Date(scheduleDate);
            const scheduleArrivalTime = new Date(scheduleDate);
            scheduleArrivalTime.setMinutes(
              scheduleArrivalTime.getMinutes() + formData.durationMinutes
            );

            schedules.push({
              flightCode: flightCode,
              departureDate: scheduleDepartureTime.toISOString(),
              arrivalDate: scheduleArrivalTime.toISOString(),
              currentPrice: formData.basePrice,
              remainingSeats: totalSeats,
              status: "scheduled"
            });
          }

          // Create all schedules
          const scheduleResults = await Promise.all(
            schedules.map(async (schedule) => {
              const response = await fetch(
                `${env.API_BASE_URL}/flight-schedules`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify(schedule)
                }
              );

              if (!response.ok) {
                const error = await response.text();
                console.error("Error creating schedule:", error);
                return null;
              }

              return await response.json();
            })
          );

          const successCount = scheduleResults.filter((r) => r !== null).length;
          if (successCount > 0) {
            toast.success(`Đã tạo ${successCount} lịch bay tự động`);
          }
        }
      }

      toast.success(
        flight ? "Cập nhật chuyến bay thành công" : "Thêm chuyến bay thành công"
      );
      onSuccess();
    } catch (error) {
      toast.error("Lỗi khi lưu chuyến bay");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const filteredDepartureAirports = airports.filter((airport) =>
    departureSearch === ""
      ? true
      : `${airport.iata} ${airport.city} ${airport.name}`
          .toLowerCase()
          .includes(departureSearch.toLowerCase())
  );

  const filteredArrivalAirports = airports.filter((airport) =>
    arrivalSearch === ""
      ? true
      : `${airport.iata} ${airport.city} ${airport.name}`
          .toLowerCase()
          .includes(arrivalSearch.toLowerCase())
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="w-5 h-5" />
            {flight ? "Chỉnh sửa chuyến bay" : "Thêm chuyến bay mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Flight Code & Airline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flightCode">
                Mã chuyến bay <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flightCode"
                value={formData.flightCode}
                onChange={(e) =>
                  handleChange("flightCode", e.target.value.toUpperCase())
                }
                placeholder="VN123"
                required
                disabled={!!flight}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="airlineId">
                Hãng hàng không <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.airlineId}
                onValueChange={(value) => handleChange("airlineId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hãng bay" />
                </SelectTrigger>
                <SelectContent>
                  {airlines.map((airline) => (
                    <SelectItem key={airline._id} value={airline._id}>
                      {airline.code} - {airline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Airports with integrated search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureAirportId">
                Sân bay đi <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.departureAirportId}
                onValueChange={(value) => {
                  handleChange("departureAirportId", value);
                  setDepartureSearch("");
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sân bay đi" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="sticky top-0 bg-white p-2 border-b z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Tìm theo IATA, thành phố, tên..."
                        className="h-9 pl-9"
                        value={departureSearch}
                        onChange={(e) => setDepartureSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredDepartureAirports.length > 0 ? (
                      filteredDepartureAirports.map((airport) => (
                        <SelectItem key={airport._id} value={airport._id}>
                          <span className="font-semibold">{airport.iata}</span>{" "}
                          - {airport.city}{" "}
                          <span className="text-gray-500">
                            ({airport.name})
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy sân bay
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalAirportId">
                Sân bay đến <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.arrivalAirportId}
                onValueChange={(value) => {
                  handleChange("arrivalAirportId", value);
                  setArrivalSearch("");
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn sân bay đến" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="sticky top-0 bg-white p-2 border-b z-10">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Tìm theo IATA, thành phố, tên..."
                        className="h-9 pl-9"
                        value={arrivalSearch}
                        onChange={(e) => setArrivalSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {filteredArrivalAirports.length > 0 ? (
                      filteredArrivalAirports.map((airport) => (
                        <SelectItem key={airport._id} value={airport._id}>
                          <span className="font-semibold">{airport.iata}</span>{" "}
                          - {airport.city}{" "}
                          <span className="text-gray-500">
                            ({airport.name})
                          </span>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Không tìm thấy sân bay
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Times */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureTime">
                Giờ khởi hành <span className="text-red-500">*</span>
              </Label>
              <Input
                id="departureTime"
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) =>
                  handleTimeChange("departureTime", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalTime">
                Giờ đến <span className="text-red-500">*</span>
              </Label>
              <Input
                id="arrivalTime"
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) =>
                  handleTimeChange("arrivalTime", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationMinutes">
                Thời gian bay{" "}
                <span className="text-gray-500 text-xs">(tự động)</span>
              </Label>
              <Input
                id="durationMinutes"
                type="text"
                value={
                  formData.durationMinutes > 0
                    ? `${Math.floor(formData.durationMinutes / 60)}h ${
                        formData.durationMinutes % 60
                      }m`
                    : ""
                }
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Row 4: Aircraft */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aircraftModel">Loại máy bay</Label>
              <Input
                id="aircraftModel"
                value={formData.aircraftModel}
                onChange={(e) => handleChange("aircraftModel", e.target.value)}
                placeholder="Boeing 787"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aircraftRegistration">Số đăng ký</Label>
              <Input
                id="aircraftRegistration"
                value={formData.aircraftRegistration}
                onChange={(e) =>
                  handleChange("aircraftRegistration", e.target.value)
                }
                placeholder="VN-A123"
              />
            </div>
          </div>

          {/* Row 5: Base Price & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">
                Giá cơ bản (VNĐ) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="basePrice"
                type="text"
                value={formatCurrency(formData.basePrice)}
                onChange={(e) =>
                  handleChange("basePrice", parseCurrency(e.target.value))
                }
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm ngưng</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto-generate Flight Schedules */}
          {!flight && (
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoGenerateSchedules"
                  checked={autoGenerateSchedules}
                  onChange={(e) => setAutoGenerateSchedules(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <Label
                  htmlFor="autoGenerateSchedules"
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Tự động tạo lịch bay cho nhiều ngày
                </Label>
              </div>

              {autoGenerateSchedules && (
                <div className="ml-6 space-y-3">
                  <p className="text-sm text-gray-500">
                    Chọn số ngày để tự động tạo lịch bay với cùng giờ khởi hành
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[7, 14, 30, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setScheduleDays(days)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          scheduleDays === days
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        {days} ngày
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="customDays" className="text-sm">
                      Hoặc nhập số ngày tùy chỉnh:
                    </Label>
                    <Input
                      id="customDays"
                      type="number"
                      min="1"
                      max="365"
                      value={scheduleDays}
                      onChange={(e) =>
                        setScheduleDays(parseInt(e.target.value) || 7)
                      }
                      className="w-24"
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 flex items-start gap-2">
                      <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        Sẽ tạo <strong>{scheduleDays} lịch bay</strong> từ{" "}
                        {formData.departureTime ? (
                          <>
                            <strong>
                              {new Date(
                                formData.departureTime
                              ).toLocaleDateString("vi-VN")}
                            </strong>{" "}
                            đến{" "}
                            <strong>
                              {new Date(
                                new Date(formData.departureTime).getTime() +
                                  (scheduleDays - 1) * 24 * 60 * 60 * 1000
                              ).toLocaleDateString("vi-VN")}
                            </strong>
                          </>
                        ) : (
                          <span className="text-gray-500">
                            (vui lòng chọn giờ khởi hành)
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flight Classes Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold">Hạng ghế</Label>
                <p className="text-sm text-gray-500 mt-1">
                  Thêm các hạng ghế cho chuyến bay này
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFlightClass}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm hạng
              </Button>
            </div>

            <div className="space-y-3">
              {flightClasses.map((flightClass, index) => {
                // Get all selected class names except current index
                const selectedClassNames = flightClasses
                  .map((fc, i) => (i !== index ? fc.className : null))
                  .filter(Boolean);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 border rounded-lg bg-gray-50 items-end"
                  >
                    <div>
                      <Label>
                        Tên hạng <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={flightClass.className}
                        onValueChange={(value) =>
                          updateFlightClass(index, "className", value)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Chọn hạng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="Business"
                            disabled={selectedClassNames.includes("Business")}
                          >
                            Thương gia
                            {selectedClassNames.includes("Business") && (
                              <span className="text-gray-400 ml-2">
                                (đã chọn)
                              </span>
                            )}
                          </SelectItem>
                          <SelectItem
                            value="Premium Economy"
                            disabled={selectedClassNames.includes(
                              "Premium Economy"
                            )}
                          >
                            Phổ thông đặc biệt
                            {selectedClassNames.includes("Premium Economy") && (
                              <span className="text-gray-400 ml-2">
                                (đã chọn)
                              </span>
                            )}
                          </SelectItem>
                          <SelectItem
                            value="Economy"
                            disabled={selectedClassNames.includes("Economy")}
                          >
                            Phổ thông
                            {selectedClassNames.includes("Economy") && (
                              <span className="text-gray-400 ml-2">
                                (đã chọn)
                              </span>
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Giá (VNĐ) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formatCurrency(flightClass.basePrice)}
                        onChange={(e) =>
                          updateFlightClass(
                            index,
                            "basePrice",
                            parseCurrency(e.target.value)
                          )
                        }
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Số ghế <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={flightClass.availableSeats}
                        onChange={(e) =>
                          updateFlightClass(
                            index,
                            "availableSeats",
                            parseInt(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    <div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFlightClass(index)}
                        disabled={flightClasses.length === 1}
                        className="w-full md:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Tổng số ghế:</strong>{" "}
                {flightClasses.reduce(
                  (sum, fc) => sum + (fc.availableSeats || 0),
                  0
                )}{" "}
                ghế
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : flight ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
