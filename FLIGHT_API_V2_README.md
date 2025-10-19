# ✈️ Flight API v2 - Complete Redesign

## 📋 Tổng quan

Thiết kế lại hoàn toàn hệ thống API Flight với kiến trúc chuẩn, tách biệt các entities và relationships rõ ràng.

## 🗂️ Database Schema

### 1. **Airline** (Hãng hàng không)

```javascript
{
  _id: ObjectId,
  name: String,           // Vietnam Airlines
  code: String,           // VN (unique)
  logo: String,           // URL logo
  description: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **Airport** (Sân bay)

```javascript
{
  _id: String,           // "A001"
  name: String,          // Sân bay Nội Bài
  city: String,          // Hà Nội
  icao: String,          // VVNB
  iata: String,          // HAN
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **Flight** (Chuyến bay cơ bản)

```javascript
{
  _id: ObjectId,
  flightCode: String,                  // VN123 (unique)
  airlineId: ObjectId → Airline,
  departureAirportId: String → Airport,
  arrivalAirportId: String → Airport,
  departureTime: String,               // "08:30" (giờ khởi hành)
  arrivalTime: String,                 // "10:45" (giờ đến)
  durationMinutes: Number,             // 135
  basePrice: Number,                   // Giá cơ bản
  availableSeats: Number,              // Tổng số ghế
  status: String,                      // active, inactive, cancelled
  aircraft: {
    model: String,
    registration: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **FlightClass** (Hạng ghế)

```javascript
{
  _id: ObjectId,
  flightCode: String → Flight,         // VN123
  className: String,                   // Economy, Business, First Class
  price: Number,                       // Giá vé
  baggageAllowance: Number,            // 23kg
  cabinBaggage: Number,                // 7kg
  availableSeats: Number,              // Số ghế trống
  amenities: [String],                 // ["Meals", "WiFi"]
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **FlightSchedule** (Lịch bay cụ thể)

```javascript
{
  _id: ObjectId,
  flightCode: String → Flight,         // VN123
  departureDate: Date,                 // 2025-10-20 08:30:00
  arrivalDate: Date,                   // 2025-10-20 10:45:00
  status: String,                      // scheduled, boarding, departed, arrived, delayed, cancelled
  remainingSeats: Number,              // Ghế còn lại
  currentPrice: Number,                // Giá động theo ngày
  delay: {
    minutes: Number,
    reason: String
  },
  gate: String,                        // A12
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Relationships

```
Airline (1) ←→ (N) Flight
Airport (1) ←→ (N) Flight (departure)
Airport (1) ←→ (N) Flight (arrival)
Flight (1) ←→ (N) FlightClass
Flight (1) ←→ (N) FlightSchedule
```

## 📡 API Endpoints

### Airlines

```
GET    /api/airlines                 - Lấy danh sách hãng hàng không
GET    /api/airlines/:id             - Chi tiết hãng
POST   /api/airlines                 - Tạo mới (Admin)
PUT    /api/airlines/:id             - Cập nhật (Admin)
DELETE /api/airlines/:id             - Xóa (Admin)
```

### Airports

```
GET    /api/airports                 - Lấy danh sách sân bay
GET    /api/airports/search          - Tìm kiếm sân bay
GET    /api/airports/:id             - Chi tiết sân bay
```

### Flights

```
GET    /api/flights                  - Lấy danh sách chuyến bay
GET    /api/flights/search           - Tìm chuyến bay theo lộ trình & ngày
GET    /api/flights/:id              - Chi tiết chuyến bay
POST   /api/flights                  - Tạo chuyến bay (Admin)
PUT    /api/flights/:id              - Cập nhật (Admin)
DELETE /api/flights/:id              - Xóa (Admin)
```

### Flight Classes

```
GET    /api/flight-classes           - Lấy danh sách hạng ghế
GET    /api/flight-classes/:id       - Chi tiết hạng ghế
POST   /api/flight-classes           - Tạo hạng ghế (Admin)
PUT    /api/flight-classes/:id       - Cập nhật (Admin)
DELETE /api/flight-classes/:id       - Xóa (Admin)
```

### Flight Schedules

```
GET    /api/flight-schedules         - Lấy danh sách lịch bay
GET    /api/flight-schedules/:id     - Chi tiết lịch bay
POST   /api/flight-schedules         - Tạo lịch bay (Admin)
POST   /api/flight-schedules/bulk    - Tạo nhiều lịch cùng lúc (Admin)
PUT    /api/flight-schedules/:id     - Cập nhật (Admin)
DELETE /api/flight-schedules/:id     - Xóa (Admin)
```

## 💡 Use Cases

### 1. Tìm chuyến bay

```javascript
GET /api/flights/search?from=HAN&to=SGN&date=2025-10-20

Response:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "flightCode": "VN123",
      "airlineId": { name: "Vietnam Airlines", logo: "..." },
      "departureAirportId": { name: "Nội Bài", city: "Hà Nội", iata: "HAN" },
      "arrivalAirportId": { name: "Tân Sơn Nhất", city: "TP.HCM", iata: "SGN" },
      "departureTime": "08:30",
      "arrivalTime": "10:45",
      "durationMinutes": 135,
      "schedule": {
        "departureDate": "2025-10-20T08:30:00Z",
        "arrivalDate": "2025-10-20T10:45:00Z",
        "remainingSeats": 120,
        "currentPrice": 1800000,
        "status": "scheduled"
      },
      "classes": [
        {
          "className": "Economy",
          "price": 1800000,
          "baggageAllowance": 23,
          "cabinBaggage": 7,
          "availableSeats": 80
        },
        {
          "className": "Business",
          "price": 4500000,
          "baggageAllowance": 32,
          "cabinBaggage": 14,
          "availableSeats": 20
        }
      ]
    }
  ],
  "count": 5
}
```

### 2. Xem chi tiết chuyến bay

```javascript
GET /api/flights/:id

Response:
{
  "success": true,
  "data": {
    ...flight info,
    "classes": [...],
    "upcomingSchedules": [...]
  }
}
```

### 3. Tạo lịch bay hàng loạt

```javascript
POST /api/flight-schedules/bulk
{
  "flightCode": "VN123",
  "dates": ["2025-10-20", "2025-10-21", "2025-10-22"],
  "currentPrice": 1800000
}

Response: Tạo 3 lịch bay cho VN123 trong 3 ngày
```

## 🎯 Migration từ hệ thống cũ

### Old Structure:

```javascript
Flight {
  flightNumber: "VN123",
  airline: "Vietnam Airlines",
  departureAirport: { code, name, city },
  arrivalAirport: { code, name, city },
  departureTime: Date,
  arrivalTime: Date,
  seatInfo: {
    classes: {
      economy: { price, available },
      business: { price, available }
    }
  }
}
```

### New Structure:

```javascript
// 1. Tạo Airline
Airline { name: "Vietnam Airlines", code: "VN" }

// 2. Airports đã có sẵn
Airport { _id: "HAN", name: "Nội Bài", city: "Hà Nội" }

// 3. Tạo Flight
Flight {
  flightCode: "VN123",
  airlineId: <AirlineId>,
  departureAirportId: "HAN",
  arrivalAirportId: "SGN",
  departureTime: "08:30",
  arrivalTime: "10:45"
}

// 4. Tạo FlightClasses
FlightClass { flightCode: "VN123", className: "Economy", price: 1800000 }
FlightClass { flightCode: "VN123", className: "Business", price: 4500000 }

// 5. Tạo Schedules cho các ngày cụ thể
FlightSchedule { flightCode: "VN123", departureDate: "2025-10-20T08:30" }
```

## 📝 Files Created/Modified

### Models:

- ✅ `server/models/Airline.js` - NEW
- ✅ `server/models/Flight.js` - UPDATED (completely redesigned)
- ✅ `server/models/FlightClass.js` - NEW
- ✅ `server/models/FlightSchedule.js` - NEW
- ✅ `server/models/Airport.js` - EXISTING (no change)

### Routes:

- ✅ `server/routes/airlines.js` - NEW
- ✅ `server/routes/flights.js` - UPDATED (redesigned)
- ✅ `server/routes/flightclasses.js` - NEW
- ✅ `server/routes/flightschedules.js` - NEW
- ✅ `server/routes/airports.js` - EXISTING (no change)
- ✅ `server/index.js` - UPDATED (added new routes)

## ⚡ Advantages

### Old Design Issues:

❌ Embedded data (airline, airports) - hard to manage  
❌ No separate schedule management  
❌ Limited class information  
❌ Can't track real-time flight status  
❌ No price dynamics

### New Design Benefits:

✅ Normalized database structure  
✅ Easy to manage airlines separately  
✅ Flexible schedule management  
✅ Detailed class information with amenities  
✅ Real-time status tracking  
✅ Dynamic pricing support  
✅ Better query performance with indexes  
✅ Scalable architecture

## 🧪 Testing

### 1. Create Airline

```bash
POST /api/airlines
{
  "name": "Vietnam Airlines",
  "code": "VN",
  "logo": "https://example.com/vn-logo.png",
  "description": "Hãng hàng không quốc gia Việt Nam"
}
```

### 2. Create Flight

```bash
POST /api/flights
{
  "flightCode": "VN123",
  "airlineId": "<airlineId>",
  "departureAirportId": "HAN",
  "arrivalAirportId": "SGN",
  "departureTime": "08:30",
  "arrivalTime": "10:45",
  "durationMinutes": 135,
  "basePrice": 1500000,
  "availableSeats": 180
}
```

### 3. Create Flight Classes

```bash
POST /api/flight-classes
{
  "flightCode": "VN123",
  "className": "Economy",
  "price": 1800000,
  "baggageAllowance": 23,
  "cabinBaggage": 7,
  "availableSeats": 150
}
```

### 4. Create Schedules

```bash
POST /api/flight-schedules/bulk
{
  "flightCode": "VN123",
  "dates": ["2025-10-20", "2025-10-21", "2025-10-22"],
  "currentPrice": 1800000
}
```

### 5. Search Flights

```bash
GET /api/flights/search?from=HAN&to=SGN&date=2025-10-20
```

## 📚 Documentation

- Swagger UI: `http://localhost:5000/api-docs`
- All APIs documented with Swagger/OpenAPI specs
- Full CRUD operations for all entities
- Admin-protected routes with JWT authentication

## 🚀 Next Steps

1. **Migration Script**: Create script to migrate old flight data to new structure
2. **Frontend Update**: Update client to use new API structure
3. **Booking Integration**: Update booking flow to use schedules
4. **Admin Panel**: Create UI for managing airlines, flights, classes, schedules
5. **Price Algorithm**: Implement dynamic pricing based on demand
6. **Notifications**: Add real-time flight status updates via Socket.IO

---

**Created**: October 19, 2025  
**Version**: 2.0.0  
**Status**: ✅ Complete & Ready for Testing
