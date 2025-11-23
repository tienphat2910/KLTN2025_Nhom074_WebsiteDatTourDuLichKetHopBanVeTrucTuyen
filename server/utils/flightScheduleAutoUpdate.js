const FlightSchedule = require('../models/FlightSchedule');
const { notifyFlightStatusChange } = require('./socketHandler');

/**
 * Auto-update flight schedule statuses based on time
 * - 2 hours before departure: scheduled -> boarding
 * - At departure time: boarding -> departed
 * - At arrival time: departed -> arrived
 */
async function updateFlightScheduleStatuses() {
    try {
        const now = new Date();
        console.log(`\n🔄 Checking flight schedules at ${now.toLocaleString('vi-VN')}`);

        // Get all active schedules that need status updates
        const schedules = await FlightSchedule.find({
            status: { $in: ['scheduled', 'boarding', 'departed'] }
        });

        console.log(`📊 Found ${schedules.length} active schedules to check`);
        let updatedCount = 0;

        for (const schedule of schedules) {
            const departureTime = new Date(schedule.departureDate);
            const arrivalTime = new Date(schedule.arrivalDate);

            // Time difference in minutes
            const minutesToDeparture = (departureTime - now) / (1000 * 60);
            const minutesSinceDeparture = (now - departureTime) / (1000 * 60);
            const minutesSinceArrival = (now - arrivalTime) / (1000 * 60);

            let newStatus = schedule.status;
            let statusChanged = false;

            // Rule 1: At/after arrival time -> arrived (highest priority)
            if (schedule.status === 'departed' && minutesSinceArrival >= 0) {
                newStatus = 'arrived';
                statusChanged = true;
                console.log(`🛬 Flight ${schedule.flightCode} has ARRIVED (${Math.round(minutesSinceArrival)} mins since arrival)`);
            }

            // Rule 2: At/after departure time -> departed (skip boarding if already past departure)
            else if ((schedule.status === 'boarding' || schedule.status === 'scheduled') && minutesSinceDeparture >= 0) {
                newStatus = 'departed';
                statusChanged = true;
                console.log(`🛫 Flight ${schedule.flightCode} has DEPARTED (${Math.round(minutesSinceDeparture)} mins since departure)`);
            }

            // Rule 3: 2 hours before departure -> boarding
            else if (schedule.status === 'scheduled' && minutesToDeparture <= 120 && minutesToDeparture > 0) {
                newStatus = 'boarding';
                statusChanged = true;
                console.log(`✈️ Flight ${schedule.flightCode} is now BOARDING (${Math.round(minutesToDeparture)} mins to departure)`);
            }

            // Update status if changed
            if (statusChanged) {
                schedule.status = newStatus;
                await schedule.save();
                updatedCount++;

                // Notify clients via Socket.IO
                notifyFlightStatusChange({
                    _id: schedule._id,
                    flightCode: schedule.flightCode,
                    status: newStatus,
                    departureDate: schedule.departureDate,
                    arrivalDate: schedule.arrivalDate
                });
            }
        }

        if (updatedCount > 0) {
            console.log(`✅ Updated ${updatedCount} flight schedule(s) status`);
        }

        return updatedCount;
    } catch (error) {
        console.error('❌ Error updating flight schedule statuses:', error);
        return 0;
    }
}

/**
 * Start auto-update scheduler
 * Runs every 1 minute
 */
function startFlightScheduleAutoUpdate() {
    console.log('🚀 Starting flight schedule auto-update service...');

    // Run immediately on start
    updateFlightScheduleStatuses();

    // Then run every 1 minute
    const interval = setInterval(updateFlightScheduleStatuses, 60 * 1000);

    console.log('✅ Flight schedule auto-update service started (runs every 1 minute)');

    return interval;
}

/**
 * Stop auto-update scheduler
 */
function stopFlightScheduleAutoUpdate(interval) {
    if (interval) {
        clearInterval(interval);
        console.log('⏹️ Flight schedule auto-update service stopped');
    }
}

module.exports = {
    updateFlightScheduleStatuses,
    startFlightScheduleAutoUpdate,
    stopFlightScheduleAutoUpdate
};
