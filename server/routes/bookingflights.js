const express = require('express');
const BookingFlight = require('../models/BookingFlight');
const FlightPassenger = require('../models/FlightPassenger');
const FlightClass = require('../models/FlightClass');
const router = express.Router();

/**
 * Calculate number of seats occupied by passengers
 * Infants (under 2 years old) don't occupy seats
 * @param {Array} passengers - Array of passenger objects with dateOfBirth
 * @returns {number} Number of seats to deduct
 */
const calculateSeatsOccupied = (passengers) => {
    if (!passengers || passengers.length === 0) return 0;

    const today = new Date();
    let seatsCount = 0;

    passengers.forEach(passenger => {
        if (passenger.dateOfBirth) {
            const birthDate = new Date(passenger.dateOfBirth);
            const ageInYears = (today - birthDate) / (365.25 * 24 * 60 * 60 * 1000);

            // Only count passengers 2 years or older (adults and children, NOT infants)
            if (ageInYears >= 2) {
                seatsCount++;
            }
        }
    });

    return seatsCount;
};

// Create a new booking flight with passengers
router.post('/', async (req, res) => {
    try {
        const { passengers, ...bookingFlightData } = req.body;

        // Calculate seats to deduct (adults + children, NOT infants)
        const seatsToDeduct = calculateSeatsOccupied(passengers);

        // Update available seats in FlightClass
        if (bookingFlightData.flightClassId && seatsToDeduct > 0) {
            const flightClass = await FlightClass.findById(bookingFlightData.flightClassId);

            if (!flightClass) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy hạng vé'
                });
            }

            if (flightClass.availableSeats < seatsToDeduct) {
                return res.status(400).json({
                    success: false,
                    message: `Không đủ ghế trống. Còn ${flightClass.availableSeats} ghế, cần ${seatsToDeduct} ghế`
                });
            }

            // Deduct seats
            flightClass.availableSeats -= seatsToDeduct;
            await flightClass.save();
        }

        // Create the booking flight
        const bookingFlight = new BookingFlight(bookingFlightData);
        await bookingFlight.save();

        // Create passenger records if provided
        let createdPassengers = [];
        if (passengers && passengers.length > 0) {
            const passengerDocs = passengers.map(passenger => ({
                ...passenger,
                bookingFlightId: bookingFlight._id
            }));
            createdPassengers = await FlightPassenger.insertMany(passengerDocs);
        }

        res.status(201).json({
            success: true,
            data: {
                bookingFlight,
                passengers: createdPassengers
            },
            message: `Đặt vé thành công. Đã trừ ${seatsToDeduct} ghế.`
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all booking flights
router.get('/', async (req, res) => {
    try {
        const bookingFlights = await BookingFlight.find();
        res.json({ success: true, data: bookingFlights });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get a booking flight by ID with passengers
router.get('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findById(req.params.id)
            .populate('flightId')
            .populate('flightClassId')
            .populate('bookingId');

        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Get associated passengers
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });

        res.json({
            success: true,
            data: {
                ...bookingFlight.toObject(),
                passengers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update a booking flight
router.put('/:id', async (req, res) => {
    try {
        const oldBookingFlight = await BookingFlight.findById(req.params.id);
        if (!oldBookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // If status is being changed to cancelled, return seats
        if (req.body.status === 'cancelled' && oldBookingFlight.status !== 'cancelled') {
            const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
            const seatsToReturn = calculateSeatsOccupied(passengers);

            // Return seats to FlightClass
            if (oldBookingFlight.flightClassId && seatsToReturn > 0) {
                const flightClass = await FlightClass.findById(oldBookingFlight.flightClassId);
                if (flightClass) {
                    flightClass.availableSeats += seatsToReturn;
                    await flightClass.save();
                }
            }
        }

        const bookingFlight = await BookingFlight.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: bookingFlight });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete a booking flight and its passengers
router.delete('/:id', async (req, res) => {
    try {
        const bookingFlight = await BookingFlight.findById(req.params.id);
        if (!bookingFlight) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Get passengers to calculate seats to return
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
        const seatsToReturn = calculateSeatsOccupied(passengers);

        // Return seats to FlightClass
        if (bookingFlight.flightClassId && seatsToReturn > 0) {
            const flightClass = await FlightClass.findById(bookingFlight.flightClassId);
            if (flightClass) {
                flightClass.availableSeats += seatsToReturn;
                await flightClass.save();
            }
        }

        // Delete booking and passengers
        await BookingFlight.findByIdAndDelete(req.params.id);
        await FlightPassenger.deleteMany({ bookingFlightId: req.params.id });

        res.json({
            success: true,
            message: `Đã xóa booking và hoàn trả ${seatsToReturn} ghế`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all passengers for a booking flight
router.get('/:id/passengers', async (req, res) => {
    try {
        const passengers = await FlightPassenger.find({ bookingFlightId: req.params.id });
        res.json({ success: true, data: passengers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
