# Flight Booking Schema Update - Documentation

## Overview

This document describes the database schema restructure for the flight booking system. The main goal was to normalize the database by separating passenger information into its own collection and improving the BookingFlight schema.

## Changes Made

### 1. New FlightPassenger Model

**File:** `server/models/FlightPassenger.js`

Created a new separate model for storing passenger information with the following fields:

```javascript
{
  bookingFlightId: ObjectId (ref: BookingFlight) - Reference to the booking
  fullName: String - Passenger's full name
  identityNumber: String - CCCD/CMND/Passport number
  dateOfBirth: Date - Date of birth
  seatNumber: String - Seat assignment (optional)
  phoneNumber: String - Contact phone (optional)
  email: String - Contact email (optional)
  gender: Enum["Nam", "Nữ"] - Gender
  nationality: String - Default: "Vietnam"
  createdAt: Date
  updatedAt: Date
}
```

**Benefits:**

- Passengers are now queryable independently
- Better data integrity
- Easier to manage passenger information
- Index on `bookingFlightId` for faster queries

---

### 2. Updated BookingFlight Model

**File:** `server/models/BookingFlight.js`

**Removed Fields:**

- `passengers` (embedded array) - Now separate collection
- `numAdults`, `numChildren`, `numInfants` - Replaced with numTickets
- `priceByClass` (object) - No longer needed
- `classType` (enum) - Replaced with flightClassId reference

**Added Fields:**

```javascript
{
  flightCode: String - Flight code reference
  flightClassId: ObjectId (ref: FlightClass) - Reference to flight class
  numTickets: Number - Total number of tickets
  pricePerTicket: Number - Price per ticket
  totalFlightPrice: Number - Total flight price
  discountCode: String - Applied discount code
  discountAmount: Number - Discount amount (default: 0)
}
```

**Retained Fields:**

- `bookingId` - Reference to main booking
- `flightId` - Reference to flight
- `status` - Booking status
- `note` - Special notes
- `paymentMethod` - Payment method

**Benefits:**

- Cleaner schema with proper references
- No redundant price storage
- Direct reference to FlightClass
- Better discount tracking
- Improved query performance with indexes

---

### 3. Updated Booking Flight Routes

**File:** `server/routes/bookingflights.js`

**POST /bookingflights**

- Now accepts `passengers` array separately
- Creates BookingFlight first
- Then creates FlightPassenger records with `bookingFlightId`
- Returns both bookingFlight and passengers in response

**GET /bookingflights/:id**

- Populates `flightId`, `flightClassId`, and `bookingId`
- Fetches associated passengers from FlightPassenger collection
- Returns combined data

**DELETE /bookingflights/:id**

- Deletes BookingFlight record
- Automatically deletes all associated FlightPassenger records

**GET /bookingflights/:id/passengers**

- New route to fetch all passengers for a specific booking

---

### 4. Updated Frontend Service

**File:** `client/src/services/bookingFlightService.ts`

**PassengerInfo Interface:**

```typescript
{
  fullName: string
  phoneNumber?: string
  email?: string
  gender: "Nam" | "Nữ"
  dateOfBirth: string
  identityNumber?: string
  seatNumber?: string
  nationality?: string
}
```

**BookingFlightPayload Interface:**

```typescript
{
  flightId: string
  flightCode: string
  flightClassId: string
  numTickets: number
  pricePerTicket: number
  totalFlightPrice: number
  discountAmount?: number
  finalTotal?: number
  discountCode?: string
  status?: string
  passengers?: PassengerInfo[]
  note?: string
  paymentMethod?: string
  bookingId?: string
}
```

---

### 5. Updated Booking Flight Page

**File:** `client/src/app/bookingflight/page.tsx`

**Key Changes:**

- Updated passenger initialization to use new field names
- Changed price calculation to use `numTickets`, `pricePerTicket`, `totalFlightPrice`
- Get `flightClassId` from selected flight class
- Updated form fields: `cccd` → `identityNumber`, `phone` → `phoneNumber`
- Simplified ticket pricing (removed separate infant pricing calculation)
- Updated MoMo payment data structure
- Updated validation to use new field names

**Passenger Type Tracking:**

- Now determines passenger type by index position in array
- First N are adults, next M are children, remaining are infants

---

### 6. Updated Payment Success Page

**File:** `client/src/app/payment/success/page.tsx`

**Key Changes:**

- Added support for both tour and flight bookings
- Created separate interfaces: `BookingTourData` and `BookingFlightData`
- Checks both `pendingBooking` (tour) and `pendingFlightBooking` (flight) in localStorage
- Routes to appropriate service based on booking type
- Clears correct localStorage key after completion
- Updated success messages for both types

---

## Database Relationships

### New Structure:

```
Booking 1 → * BookingFlight
Flight 1 → * BookingFlight
FlightClass 1 → * BookingFlight
BookingFlight 1 → * FlightPassenger
```

### Benefits:

1. **Normalized Data**: No redundant information stored
2. **Better Queries**: Can query passengers independently
3. **Data Integrity**: Foreign key constraints through ObjectId references
4. **Scalability**: Easy to add new fields without affecting embedded arrays
5. **Performance**: Indexed relationships for faster lookups

---

## Migration Notes

### For Existing Data:

If you have existing BookingFlight records with embedded passengers, you'll need to migrate them:

```javascript
// Migration script example (not included, needs to be created)
const existingBookings = await BookingFlight.find({
  passengers: { $exists: true }
});

for (const booking of existingBookings) {
  // Create FlightPassenger records
  const passengers = booking.passengers.map((p) => ({
    bookingFlightId: booking._id,
    fullName: p.fullName,
    phoneNumber: p.phone,
    email: p.email,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    identityNumber: p.cccd,
    nationality: "Vietnam"
  }));

  await FlightPassenger.insertMany(passengers);

  // Update BookingFlight with new schema
  // Calculate numTickets, get flightClassId, etc.
}
```

---

## Testing Checklist

- [ ] Create new flight booking with passengers
- [ ] Verify FlightPassenger records are created
- [ ] Test GET booking with populated data
- [ ] Test discount code application
- [ ] Test MoMo payment flow for flights
- [ ] Test cash payment flow for flights
- [ ] Test bank transfer payment flow for flights
- [ ] Verify payment success page handles flights
- [ ] Test booking deletion (passengers should be deleted too)
- [ ] Test passenger retrieval endpoint

---

## API Endpoints Summary

### BookingFlight

- `POST /bookingflights` - Create booking with passengers
- `GET /bookingflights` - Get all bookings
- `GET /bookingflights/:id` - Get booking with passengers
- `GET /bookingflights/:id/passengers` - Get passengers only
- `PUT /bookingflights/:id` - Update booking
- `DELETE /bookingflights/:id` - Delete booking and passengers

### Payment

- Existing MoMo endpoints work with new schema
- Payment success page handles both tours and flights

---

## Breaking Changes

⚠️ **Frontend Breaking Changes:**

- `numAdults`, `numChildren`, `numInfants` → `numTickets`
- `classType` → `flightClassId`
- `priceByClass` → `pricePerTicket` + `totalFlightPrice`
- `subtotal` → `totalFlightPrice`
- Passenger fields: `phone` → `phoneNumber`, `cccd` → `identityNumber`

⚠️ **Backend Breaking Changes:**

- Embedded `passengers` array removed from BookingFlight
- New FlightPassenger collection required
- API response structure changed for GET endpoints

---

## Next Steps

1. ✅ Update all models
2. ✅ Update routes to handle new schema
3. ✅ Update frontend service
4. ✅ Update booking page
5. ✅ Update payment success page
6. ⏳ Create migration script for existing data (if needed)
7. ⏳ Test complete booking flow
8. ⏳ Update admin panel to display new structure
9. ⏳ Update booking management pages

---

## Notes

- All infant pricing is now the same as adult/child pricing in the new schema. If you need different pricing for infants, you should create a separate FlightClass entry with infant pricing.
- Seat numbers are optional and can be assigned later by admin.
- The system maintains backward compatibility for tour bookings.
- Consider adding validation for maximum passengers per booking.
- **CCCD/CMND is required for all passengers** - Flight bookings require identity verification.
- **Cash payment is NOT available for flight bookings** - Only MoMo and Bank Transfer are accepted.

---

**Last Updated:** 2024
**Author:** GitHub Copilot
