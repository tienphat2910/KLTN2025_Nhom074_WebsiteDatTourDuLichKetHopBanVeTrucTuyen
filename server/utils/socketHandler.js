const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            console.error('Socket authentication error:', error);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.fullName} (${socket.user._id})`);

        // Join user-specific room
        socket.join(`user_${socket.user._id}`);

        // Admin users join admin room
        if (socket.user.role === 'admin') {
            socket.join('admin_room');
            console.log(`Admin ${socket.user.fullName} joined admin room`);
        }

        // Handle admin room join/leave
        socket.on('join_admin_room', () => {
            if (socket.user.role === 'admin') {
                socket.join('admin_room');
                console.log(`Admin ${socket.user.fullName} joined admin room`);
            }
        });

        socket.on('leave_admin_room', () => {
            socket.leave('admin_room');
            console.log(`Admin ${socket.user.fullName} left admin room`);
        });

        // Handle sending notifications to specific users
        socket.on('send_notification', (data) => {
            if (socket.user.role === 'admin') {
                const { userId, notification } = data;
                io.to(`user_${userId}`).emit('new_notification', {
                    ...notification,
                    from: socket.user._id,
                    timestamp: new Date()
                });
            }
        });

        // Handle broadcasting system messages
        socket.on('broadcast_system_message', (data) => {
            if (socket.user.role === 'admin') {
                const { message, type } = data;
                io.to('admin_room').emit('system_alert', {
                    message,
                    type,
                    from: socket.user.fullName,
                    timestamp: new Date()
                });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.fullName} (${socket.user._id})`);
        });
    });

    return io;
};

// Helper functions to emit events from other parts of the application
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admin_room').emit(event, data);
    }
};

const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

// Specific event emitters for common actions
const notifyUserRegistered = (userData) => {
    emitToAdmins('user_registered', {
        user: {
            _id: userData._id,
            fullName: userData.fullName,
            email: userData.email,
            createdAt: userData.createdAt
        },
        timestamp: new Date()
    });
};

const notifyBookingCreated = (bookingData) => {
    console.log('📢 [socketHandler] notifyBookingCreated called for booking:', bookingData._id);

    // Extract user info if populated
    const userInfo = bookingData.userId && typeof bookingData.userId === 'object'
        ? {
            _id: bookingData.userId._id,
            fullName: bookingData.userId.fullName,
            email: bookingData.userId.email,
            phone: bookingData.userId.phone
        }
        : null;

    const eventData = {
        booking: {
            _id: bookingData._id,
            userId: bookingData.userId,
            user: userInfo, // Add user info
            bookingType: bookingData.bookingType, // Use bookingType instead of type
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            createdAt: bookingData.createdAt
        },
        timestamp: new Date()
    };

    console.log('📤 [socketHandler] Emitting booking_created to admin_room:', eventData.booking._id);
    emitToAdmins('booking_created', eventData);

    // Also notify the user who made the booking (use userId._id if populated)
    const userIdToNotify = typeof bookingData.userId === 'object'
        ? bookingData.userId._id
        : bookingData.userId;

    emitToUser(userIdToNotify, 'booking_confirmed', {
        booking: bookingData,
        timestamp: new Date()
    });
};

const notifyBookingUpdated = (bookingData) => {
    // Extract user info if populated
    const userInfo = bookingData.userId && typeof bookingData.userId === 'object'
        ? {
            _id: bookingData.userId._id,
            fullName: bookingData.userId.fullName,
            email: bookingData.userId.email,
            phone: bookingData.userId.phone
        }
        : null;

    emitToAdmins('booking_updated', {
        booking: {
            _id: bookingData._id,
            userId: bookingData.userId,
            user: userInfo,
            bookingType: bookingData.bookingType, // Use bookingType instead of type
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            updatedAt: bookingData.updatedAt
        },
        timestamp: new Date()
    });
};

const notifyBookingCancelled = (bookingData) => {
    // Extract user info if populated
    const userInfo = bookingData.userId && typeof bookingData.userId === 'object'
        ? {
            _id: bookingData.userId._id,
            fullName: bookingData.userId.fullName,
            email: bookingData.userId.email,
            phone: bookingData.userId.phone
        }
        : null;

    emitToAdmins('booking_cancelled', {
        booking: {
            _id: bookingData._id,
            userId: bookingData.userId,
            user: userInfo,
            bookingType: bookingData.bookingType, // Use bookingType instead of type
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            cancelledAt: new Date()
        },
        timestamp: new Date()
    });
};

const notifyPaymentCompleted = (paymentData) => {
    emitToAdmins('payment_completed', {
        payment: {
            bookingId: paymentData.bookingId,
            amount: paymentData.amount,
            method: paymentData.method,
            status: paymentData.status
        },
        timestamp: new Date()
    });
};

const notifyUserStatusChanged = (userId, oldStatus, newStatus, changedBy) => {
    emitToAdmins('user_status_changed', {
        userId,
        oldStatus,
        newStatus,
        changedBy,
        timestamp: new Date()
    });
};

const notifySystemAlert = (message, type = 'info') => {
    emitToAdmins('system_alert', {
        message,
        type,
        timestamp: new Date()
    });
};

const notifyCancellationRequestCreated = (requestData) => {
    console.log('📢 [socketHandler] notifyCancellationRequestCreated called');

    // Extract user info if populated
    const userInfo = requestData.userId && typeof requestData.userId === 'object'
        ? {
            _id: requestData.userId._id,
            fullName: requestData.userId.fullName,
            email: requestData.userId.email
        }
        : null;

    const eventData = {
        request: {
            _id: requestData._id,
            bookingId: requestData.bookingId,
            userId: requestData.userId,
            user: userInfo,
            bookingType: requestData.bookingType,
            reason: requestData.reason,
            status: requestData.status,
            createdAt: requestData.createdAt
        },
        message: `Yêu cầu hủy ${requestData.bookingType} mới từ ${userInfo?.fullName || 'người dùng'}`,
        timestamp: new Date()
    };

    console.log('📤 [socketHandler] Emitting new_cancellation_request to admin_room');
    emitToAdmins('new_cancellation_request', eventData);
};

const notifyCancellationRequestProcessed = (requestData, processStatus) => {
    console.log('📢 [socketHandler] notifyCancellationRequestProcessed called');

    // Extract user info if populated
    const userInfo = requestData.userId && typeof requestData.userId === 'object'
        ? {
            _id: requestData.userId._id,
            fullName: requestData.userId.fullName,
            email: requestData.userId.email
        }
        : null;

    const eventData = {
        request: {
            _id: requestData._id,
            bookingId: requestData.bookingId,
            userId: requestData.userId,
            user: userInfo,
            bookingType: requestData.bookingType,
            reason: requestData.reason,
            status: requestData.status,
            adminNote: requestData.adminNote,
            processedAt: requestData.processedAt
        },
        status: processStatus,
        timestamp: new Date()
    };

    console.log('📤 [socketHandler] Emitting cancellation_request_processed to admin_room');
    emitToAdmins('cancellation_request_processed', eventData);

    // Also notify the user who made the request
    const userIdToNotify = typeof requestData.userId === 'object'
        ? requestData.userId._id
        : requestData.userId;

    emitToUser(userIdToNotify, 'cancellation_request_processed', eventData);
};

module.exports = {
    initSocket,
    emitToUser,
    emitToAdmins,
    emitToAll,
    notifyUserRegistered,
    notifyBookingCreated,
    notifyBookingUpdated,
    notifyBookingCancelled,
    notifyPaymentCompleted,
    notifyUserStatusChanged,
    notifySystemAlert,
    notifyCancellationRequestCreated,
    notifyCancellationRequestProcessed
};