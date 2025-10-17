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
    emitToAdmins('booking_created', {
        booking: {
            _id: bookingData._id,
            userId: bookingData.userId,
            type: bookingData.type,
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            createdAt: bookingData.createdAt
        },
        timestamp: new Date()
    });

    // Also notify the user who made the booking
    emitToUser(bookingData.userId, 'booking_confirmed', {
        booking: bookingData,
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

module.exports = {
    initSocket,
    emitToUser,
    emitToAdmins,
    emitToAll,
    notifyUserRegistered,
    notifyBookingCreated,
    notifyPaymentCompleted,
    notifyUserStatusChanged,
    notifySystemAlert
};