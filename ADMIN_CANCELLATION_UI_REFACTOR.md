# Admin Cancellation Requests Page UI Refactoring

## Summary

Refactored the admin cancellation requests page to use proper layout components and improve code organization.

## Changes Made

### 1. Component Separation

Created separate, reusable components:

#### **CancellationRequestStats.tsx**

- Location: `client/src/components/Admin/CancellationRequestStats.tsx`
- Purpose: Display statistics cards for total, pending, approved, and rejected requests
- Props:
  ```typescript
  {
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }
  }
  ```

#### **CancellationRequestCard.tsx**

- Location: `client/src/components/Admin/CancellationRequestCard.tsx`
- Purpose: Display individual cancellation request details in a card format
- Features:
  - Shows booking type (tour/activity/flight) with color-coded badges
  - Displays customer information
  - Shows booking value and dates
  - Includes cancellation reason and admin notes
  - "View Booking" and "Process Request" buttons
- Props:
  ```typescript
  {
    request: CancellationRequest;
    onViewBooking: (request: CancellationRequest) => void;
    onSuccess: () => void;
  }
  ```

#### **BookingDetailsModal.tsx**

- Location: `client/src/components/Admin/BookingDetailsModal.tsx`
- Purpose: Display detailed booking information in a modal dialog
- Features:
  - Customer information section
  - Tour/Activity/Flight specific details (conditional rendering)
  - Pricing breakdown
  - Payment method
  - Booking timestamps
- Props:
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    request: CancellationRequest | null;
  }
  ```

### 2. Layout Improvements

#### **Using AdminLayout Component**

- Replaced manual layout structure with `<AdminLayout>` component
- **Before**:
  ```tsx
  <div className="flex min-h-screen">
    <AdminSidebar />
    <div className="flex-1 overflow-auto">
      {/* Manual header */}
      {/* Content */}
    </div>
  </div>
  ```
- **After**:
  ```tsx
  <AdminLayout
    title="Yêu cầu hủy booking"
    breadcrumbs={[{ label: "Yêu cầu hủy" }]}
  >
    {/* Content */}
  </AdminLayout>
  ```

#### **Benefits**:

- ✅ **Fixed Sidebar**: Sidebar now stays fixed on scroll (handled by AdminLayout)
- ✅ **Consistent Header**: Uses standard admin header with breadcrumbs
- ✅ **Better Scroll Behavior**: Main content scrolls while sidebar and header stay fixed
- ✅ **Unified Notifications**: Integrates with AdminLayout's notification system

### 3. Code Organization

#### **Main Page Structure** (`page.tsx`)

Now much cleaner and focused on business logic:

```tsx
export default function CancellationRequestsPage() {
  // State management
  // Effects for loading and socket events
  // Business logic functions

  return (
    <AdminLayout>
      <CancellationRequestStats />
      <Tabs>
        <CancellationRequestCard /> {/* Mapped from data */}
      </Tabs>
      <BookingDetailsModal />
    </AdminLayout>
  );
}
```

#### **Removed Redundant Code**:

- Removed inline card rendering logic (moved to `CancellationRequestCard`)
- Removed inline stats rendering (moved to `CancellationRequestStats`)
- Removed manual layout scaffolding (using `AdminLayout`)

### 4. New Features

#### **Booking Details Modal**

- Click "Xem booking" button to view full booking details in a modal
- No need to navigate away from the page
- Shows all relevant booking information based on booking type
- Better UX compared to redirecting to booking management page

### 5. File Structure

```
client/src/
├── app/
│   └── admin/
│       └── cancellation-requests/
│           └── page.tsx (refactored, much cleaner)
└── components/
    └── Admin/
        ├── CancellationRequestStats.tsx (new)
        ├── CancellationRequestCard.tsx (new)
        ├── BookingDetailsModal.tsx (new)
        ├── AdminLayout.tsx (existing, now used)
        └── AdminSidebar.tsx (existing, via AdminLayout)
```

## Technical Details

### State Management

- `requests`: All cancellation requests from API
- `filteredRequests`: Filtered by active tab (all/pending/approved/rejected)
- `selectedRequest`: Currently selected request for booking modal
- `showBookingModal`: Controls modal visibility

### Socket Integration

- Listens for `new_cancellation_request` event
- Listens for `cancellation_request_processed` event
- Auto-reloads requests when new events arrive
- Shows toast notifications

### Responsive Design

- Grid layout for stats cards: 2 columns on mobile, 4 on desktop
- Request cards adapt to mobile/desktop views
- Modal is scrollable and responsive

## Testing Checklist

- [ ] Page loads correctly with AdminLayout
- [ ] Sidebar stays fixed when scrolling
- [ ] Header displays with breadcrumbs
- [ ] Stats cards show correct counts
- [ ] Tabs filter requests correctly
- [ ] Request cards display all information
- [ ] "View Booking" button opens modal
- [ ] Modal shows correct booking details
- [ ] "Process Request" dialog works
- [ ] Socket events trigger updates
- [ ] Toast notifications appear

## Migration Notes

- No database changes required
- No API changes required
- Only frontend component refactoring
- All existing functionality preserved
- New modal feature added for better UX

## Future Enhancements

- Add search/filter functionality
- Add sorting options
- Add export to CSV/PDF
- Add bulk operations (approve/reject multiple)
- Add email notifications from admin panel
