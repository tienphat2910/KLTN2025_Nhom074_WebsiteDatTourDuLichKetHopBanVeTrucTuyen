const express = require('express');
const BookingTour = require('../models/BookingTour');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendTourBookingEmail } = require('../utils/emailService');
const router = express.Router();

// Check available seats for a tour
router.get('/check-seats/:tourId', async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        // Calculate total booked seats for verification
        const bookings = await BookingTour.find({
            tourId: req.params.tourId,
            status: { $in: ['pending', 'confirmed'] } // Only count active bookings
        });

        const totalBookedSeats = bookings.reduce((total, booking) => {
            return total + (booking.numAdults || 0) + (booking.numChildren || 0) + (booking.numInfants || 0);
        }, 0);

        const calculatedAvailableSeats = tour.seats - totalBookedSeats;

        res.json({
            success: true,
            data: {
                tourId: tour._id,
                tourTitle: tour.title,
                totalSeats: tour.seats,
                availableSeats: tour.availableSeats,
                calculatedAvailableSeats: calculatedAvailableSeats,
                bookedSeats: totalBookedSeats,
                activeBookings: bookings.length,
                isConsistent: tour.availableSeats === calculatedAvailableSeats
            }
        });
    } catch (error) {
        console.error('❌ Check seats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create a new booking tour
router.post('/', auth, async (req, res) => {
    try {
        const { tourId, numAdults, numChildren, numInfants, bookingId } = req.body;

        // Calculate total passengers
        const totalPassengers = (numAdults || 0) + (numChildren || 0) + (numInfants || 0);

        if (totalPassengers <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng hành khách phải lớn hơn 0'
            });
        }

        // Find the tour and check available seats
        const tour = await Tour.findById(tourId).populate('destinationId');
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy tour'
            });
        }

        // Check if there are enough available seats
        if (tour.availableSeats < totalPassengers) {
            return res.status(400).json({
                success: false,
                message: `Không đủ chỗ trống. Chỉ còn ${tour.availableSeats} chỗ`
            });
        }

        // Create the booking tour
        const bookingTour = new BookingTour(req.body);
        await bookingTour.save();

        // Update booking totalPrice with the subtotal
        const booking = await Booking.findById(bookingId);
        if (booking) {
            booking.totalPrice = bookingTour.subtotal || 0;
            await booking.save();
            console.log(`✅ Booking totalPrice updated to ${bookingTour.subtotal}`);
        }

        // Update available seats in tour
        await Tour.findByIdAndUpdate(
            tourId,
            { $inc: { availableSeats: -totalPassengers } },
            { new: true }
        );

        console.log(`✅ Booking created. Reduced ${totalPassengers} seats for tour ${tourId}`);

        // Send confirmation email
        try {
            const booking = await Booking.findById(bookingId).populate('userId', 'fullName email phone');
            if (booking && booking.userId) {
                const user = booking.userId;
                const populatedBookingTour = await BookingTour.findById(bookingTour._id).populate({
                    path: 'tourId',
                    populate: {
                        path: 'destinationId',
                        model: 'Destination'
                    }
                });

                // Prepare tour data with proper field mapping
                const tourData = {
                    ...tour.toObject(),
                    title: tour.title,
                    name: tour.title, // Alias for compatibility
                    duration: tour.duration,
                    destinationId: tour.destinationId,
                    destination: tour.destinationId, // Alias for email template
                    tourGuide: tour.tourGuide
                };

                await sendTourBookingEmail(user.email, {
                    booking: booking,
                    tourBooking: {
                        ...populatedBookingTour.toObject(),
                        tourId: tourData,
                        pricePerAdult: populatedBookingTour.priceByAge?.adult || 0,
                        pricePerChild: populatedBookingTour.priceByAge?.child || 0,
                        departureDate: tour.startDate,
                        paymentMethod: populatedBookingTour.paymentMethod || 'cash'
                    },
                    user: {
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone
                    }
                });
                console.log('✅ Tour booking confirmation email sent');
            }
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            // Don't fail the booking if email fails
        }

        res.status(201).json({ success: true, data: bookingTour });
    } catch (error) {
        console.error('❌ Booking tour creation error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all booking tours
router.get('/', async (req, res) => {
    try {
        const bookingTours = await BookingTour.find()
            .populate('tourId', 'title slug seats availableSeats startDate endDate')
            .populate('bookingId', 'customerInfo totalAmount paymentStatus');
        res.json({ success: true, data: bookingTours });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a booking tour by ID
router.get('/:id', async (req, res) => {
    try {
        const bookingTour = await BookingTour.findById(req.params.id)
            .populate('tourId', 'title slug seats availableSeats startDate endDate')
            .populate('bookingId', 'customerInfo totalAmount paymentStatus');
        if (!bookingTour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
        }
        res.json({ success: true, data: bookingTour });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a booking tour
router.put('/:id', async (req, res) => {
    try {
        const { numAdults, numChildren, numInfants, status } = req.body;

        // Find the existing booking tour to get the old passenger counts and status
        const existingBooking = await BookingTour.findById(req.params.id);
        if (!existingBooking) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
        }

        // Calculate old and new total passengers
        const oldTotalPassengers = (existingBooking.numAdults || 0) +
            (existingBooking.numChildren || 0) +
            (existingBooking.numInfants || 0);

        const newTotalPassengers = (numAdults || existingBooking.numAdults || 0) +
            (numChildren || existingBooking.numChildren || 0) +
            (numInfants || existingBooking.numInfants || 0);

        if (newTotalPassengers <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng hành khách phải lớn hơn 0'
            });
        }

        let seatAdjustment = 0;

        // Handle status change
        const oldStatus = existingBooking.status;
        const newStatus = status || oldStatus;

        // If status changes from active to cancelled, return seats
        if (['pending', 'confirmed'].includes(oldStatus) && newStatus === 'cancelled') {
            seatAdjustment = oldTotalPassengers; // Return all seats
        }
        // If status changes from cancelled to active, take seats
        else if (oldStatus === 'cancelled' && ['pending', 'confirmed'].includes(newStatus)) {
            seatAdjustment = -newTotalPassengers; // Take seats
        }
        // If both old and new status are active, handle passenger count change
        else if (['pending', 'confirmed'].includes(oldStatus) && ['pending', 'confirmed'].includes(newStatus)) {
            const passengerDifference = newTotalPassengers - oldTotalPassengers;
            seatAdjustment = -passengerDifference; // Negative means take seats, positive means return seats
        }

        // If taking seats, check if there are enough available
        if (seatAdjustment < 0) {
            const tour = await Tour.findById(existingBooking.tourId);
            if (!tour) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tour'
                });
            }

            if (tour.availableSeats < Math.abs(seatAdjustment)) {
                return res.status(400).json({
                    success: false,
                    message: `Không đủ chỗ trống. Chỉ còn ${tour.availableSeats} chỗ`
                });
            }
        }

        // Update the booking tour
        const bookingTour = await BookingTour.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Update available seats in tour if needed
        if (seatAdjustment !== 0) {
            await Tour.findByIdAndUpdate(
                existingBooking.tourId,
                { $inc: { availableSeats: seatAdjustment } },
                { new: true }
            );

            console.log(`✅ Booking updated. Seat adjustment: ${seatAdjustment > 0 ? '+' : ''}${seatAdjustment} for tour ${existingBooking.tourId}`);
        }

        res.json({ success: true, data: bookingTour });
    } catch (error) {
        console.error('❌ Booking tour update error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a booking tour
router.delete('/:id', async (req, res) => {
    try {
        // Find the booking tour first to get passenger counts
        const bookingTour = await BookingTour.findById(req.params.id);
        if (!bookingTour) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });
        }

        // Calculate total passengers to return seats
        const totalPassengers = (bookingTour.numAdults || 0) +
            (bookingTour.numChildren || 0) +
            (bookingTour.numInfants || 0);

        // Delete the booking tour
        await BookingTour.findByIdAndDelete(req.params.id);

        // Return seats to tour
        await Tour.findByIdAndUpdate(
            bookingTour.tourId,
            { $inc: { availableSeats: totalPassengers } },
            { new: true }
        );

        console.log(`✅ Booking deleted. Returned ${totalPassengers} seats to tour ${bookingTour.tourId}`);

        res.json({ success: true, message: 'Đã xóa booking và hoàn trả ghế' });
    } catch (error) {
        console.error('❌ Booking tour deletion error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get tour booking details by booking ID (for frontend modal)
router.get('/booking/:bookingId/details', async (req, res) => {
    try {
        // Find all booking tours for this booking
        const bookingTours = await BookingTour.find({ bookingId: req.params.bookingId })
            .populate({
                path: 'tourId',
                populate: {
                    path: 'destinationId',
                    model: 'Destination'
                }
            })
            .populate('bookingId');

        if (!bookingTours || bookingTours.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tour' });
        }

        // For now, return the first tour booking (assuming single tour per booking)
        const bookingTour = bookingTours[0];

        // Transform the data to match frontend expectations
        const tourBookingDetail = {
            _id: bookingTour._id,
            bookingId: bookingTour.bookingId,
            tourId: {
                _id: bookingTour.tourId._id,
                title: bookingTour.tourId.title,
                slug: bookingTour.tourId.slug,
                description: bookingTour.tourId.description,
                destination: bookingTour.tourId.destinationId ? {
                    _id: bookingTour.tourId.destinationId._id,
                    name: bookingTour.tourId.destinationId.name,
                    region: bookingTour.tourId.destinationId.region,
                    image: bookingTour.tourId.destinationId.image
                } : null,
                departureLocation: bookingTour.tourId.departureLocation,
                startDate: bookingTour.tourId.startDate,
                endDate: bookingTour.tourId.endDate,
                duration: bookingTour.tourId.duration,
                images: bookingTour.tourId.images
            },
            numAdults: bookingTour.numAdults,
            numChildren: bookingTour.numChildren,
            numInfants: bookingTour.numInfants,
            priceByAge: bookingTour.priceByAge,
            subtotal: bookingTour.subtotal,
            status: bookingTour.status,
            note: bookingTour.note,
            paymentMethod: bookingTour.paymentMethod,
            passengers: bookingTour.passengers.map(passenger => ({
                _id: passenger._id,
                fullName: passenger.fullName,
                phone: passenger.phone,
                email: passenger.email,
                gender: passenger.gender,
                dateOfBirth: passenger.dateOfBirth,
                cccd: passenger.cccd,
                type: passenger.type
            })),
            createdAt: bookingTour.createdAt,
            updatedAt: bookingTour.updatedAt
        };

        res.json({
            success: true,
            data: tourBookingDetail
        });
    } catch (error) {
        console.error('Get tour booking details error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
