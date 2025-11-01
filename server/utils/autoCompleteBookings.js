const Booking = require('../models/Booking');
const BookingTour = require('../models/BookingTour');
const BookingFlight = require('../models/BookingFlight');
const BookingActivity = require('../models/BookingActivity');
const Tour = require('../models/Tour');
const FlightSchedule = require('../models/FlightSchedule');
const Activity = require('../models/Activity');
const { notifyBookingUpdated } = require('./socketHandler');

/**
 * Get end date for a booking based on its type
 * @param {Object} booking - The booking document
 * @returns {Promise<Date|null>} - The end date or null if cannot determine
 */
async function getBookingEndDate(booking) {
    try {
        switch (booking.bookingType) {
            case 'tour': {
                const bookingTour = await BookingTour.findOne({ bookingId: booking._id })
                    .populate('tourId');

                if (bookingTour && bookingTour.tourId) {
                    return bookingTour.tourId.endDate;
                }
                break;
            }

            case 'flight': {
                const flightBookings = await BookingFlight.find({ bookingId: booking._id })
                    .populate('flightId');

                if (flightBookings.length > 0) {
                    // For round trip, get the latest arrival date + time
                    // For one-way, get the arrival date + time of that flight
                    let latestArrivalDateTime = null;

                    for (const fb of flightBookings) {
                        if (fb.flightId) {
                            let arrivalDateTime = null;

                            // Try to get from FlightSchedule first (most accurate)
                            if (fb.flightId.flightCode) {
                                // Query FlightSchedule separately
                                const schedules = await FlightSchedule.find({
                                    flightCode: fb.flightId.flightCode
                                }).sort({ departureDate: -1 });

                                if (schedules.length > 0) {
                                    // Find schedule matching the departure time
                                    const matchingSchedule = schedules.find(s => {
                                        const scheduleDate = new Date(s.departureDate);
                                        const flightDate = new Date(fb.flightId.departureTime);
                                        return scheduleDate.toDateString() === flightDate.toDateString();
                                    });

                                    if (matchingSchedule && matchingSchedule.arrivalDate) {
                                        arrivalDateTime = new Date(matchingSchedule.arrivalDate);
                                        console.log(`  ✈️ Found schedule arrival: ${arrivalDateTime.toLocaleString('vi-VN')} for flight ${fb.flightId.flightCode}`);
                                    }
                                }
                            }

                            // Fallback to flight's arrivalTime if schedule not found
                            if (!arrivalDateTime && fb.flightId.arrivalTime) {
                                arrivalDateTime = new Date(fb.flightId.arrivalTime);
                                console.log(`  ✈️ Using flight arrivalTime: ${arrivalDateTime.toLocaleString('vi-VN')} for flight ${fb.flightId.flightCode}`);
                            }

                            // Keep track of the latest arrival time (important for round trips)
                            if (arrivalDateTime) {
                                if (!latestArrivalDateTime || arrivalDateTime > latestArrivalDateTime) {
                                    latestArrivalDateTime = arrivalDateTime;
                                }
                            } else {
                                console.log(`  ⚠️ No arrival time found for flight ${fb.flightId.flightCode}`);
                            }
                        }
                    }

                    if (latestArrivalDateTime && flightBookings.length > 1) {
                        console.log(`  🔄 Round trip detected - Using latest arrival: ${latestArrivalDateTime.toLocaleString('vi-VN')}`);
                    }

                    return latestArrivalDateTime;
                }
                break;
            }

            case 'activity': {
                const bookingActivity = await BookingActivity.findOne({ bookingId: booking._id })
                    .populate('activityId');

                if (bookingActivity && bookingActivity.activityId) {
                    // Activity typically has a date field
                    if (bookingActivity.activityId.endDate) {
                        return bookingActivity.activityId.endDate;
                    } else if (bookingActivity.activityId.date) {
                        return bookingActivity.activityId.date;
                    }
                }
                break;
            }

            default:
                console.log(`Unknown booking type: ${booking.bookingType}`);
                return null;
        }
    } catch (error) {
        console.error(`Error getting end date for booking ${booking._id}:`, error);
        return null;
    }

    return null;
}

/**
 * Auto-complete bookings that have passed their end date
 * This function should be called periodically (e.g., via cron job)
 */
async function autoCompleteBookings() {
    try {
        console.log('🔄 Starting auto-complete bookings task...');
        const now = new Date();

        // Find all confirmed bookings
        const confirmedBookings = await Booking.find({
            status: 'confirmed'
        });

        console.log(`📋 Found ${confirmedBookings.length} confirmed bookings to check`);

        let completedCount = 0;
        const updates = [];

        for (const booking of confirmedBookings) {
            const endDate = await getBookingEndDate(booking);

            if (endDate) {
                const endDateTime = new Date(endDate);

                // Check if the end date/time has passed (compare both date AND time)
                if (endDateTime < now) {
                    const endDateTimeStr = endDateTime.toLocaleString('vi-VN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    console.log(`✅ Booking ${booking._id.toString().slice(-8)} (${booking.bookingType}) ended at ${endDateTimeStr}. Auto-completing...`);

                    updates.push({
                        bookingId: booking._id,
                        endDate: endDateTime,
                        bookingType: booking.bookingType
                    });

                    // Update booking status to completed
                    booking.status = 'completed';
                    booking.updatedAt = new Date();
                    await booking.save();

                    // Also update related booking records
                    switch (booking.bookingType) {
                        case 'tour':
                            await BookingTour.updateMany(
                                { bookingId: booking._id },
                                { status: 'completed' }
                            );
                            break;
                        case 'activity':
                            await BookingActivity.updateMany(
                                { bookingId: booking._id },
                                { status: 'completed' }
                            );
                            break;
                    }

                    completedCount++;

                    // Notify admins about the status change
                    const populatedBooking = await Booking.findById(booking._id)
                        .populate('userId', 'fullName email phone');

                    if (populatedBooking) {
                        const bookingObj = populatedBooking.toObject();
                        const transformedBooking = {
                            ...bookingObj,
                            user: bookingObj.userId,
                            timestamp: Date.now()
                        };
                        notifyBookingUpdated(transformedBooking);
                    }
                } else {
                    const endDateTimeStr = endDateTime.toLocaleString('vi-VN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });

                    const timeRemaining = Math.round((endDateTime - now) / (1000 * 60)); // minutes
                    const hoursRemaining = Math.floor(timeRemaining / 60);
                    const minutesRemaining = timeRemaining % 60;

                    let timeStr = '';
                    if (hoursRemaining > 24) {
                        const daysRemaining = Math.floor(hoursRemaining / 24);
                        timeStr = `${daysRemaining} ngày`;
                    } else if (hoursRemaining > 0) {
                        timeStr = `${hoursRemaining}h ${minutesRemaining}m`;
                    } else {
                        timeStr = `${minutesRemaining} phút`;
                    }

                    console.log(`⏳ Booking ${booking._id.toString().slice(-8)} (${booking.bookingType}) will end at ${endDateTimeStr} (còn ${timeStr})`);
                }
            } else {
                console.log(`⚠️ Cannot determine end date for booking ${booking._id} (${booking.bookingType})`);
            }
        }

        console.log(`✅ Auto-complete task completed. Updated ${completedCount} bookings to "completed" status.`);

        return {
            success: true,
            totalChecked: confirmedBookings.length,
            completedCount,
            updates
        };
    } catch (error) {
        console.error('❌ Error in auto-complete bookings:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Schedule auto-complete task to run periodically
 * @param {number} intervalMinutes - Interval in minutes (default: 60 minutes = 1 hour)
 */
function scheduleAutoComplete(intervalMinutes = 60) {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`⏰ Scheduling auto-complete bookings task every ${intervalMinutes} minutes`);

    // Run immediately on startup
    autoCompleteBookings();

    // Then run periodically
    setInterval(async () => {
        console.log(`⏰ Running scheduled auto-complete task at ${new Date().toLocaleString('vi-VN')}`);
        await autoCompleteBookings();
    }, intervalMs);
}

module.exports = {
    getBookingEndDate,
    autoCompleteBookings,
    scheduleAutoComplete
};
