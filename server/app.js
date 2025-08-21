const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const { readdirSync } = require('fs');

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useCreateIndex: true,
        // useFindAndModify: false
    })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message:
        'Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau ít phút.'
});
app.use('/api', limiter);

// API routes
const toursRouter = require('./routes/tours');
const destinationsRouter = require('./routes/destinations');
const authRouter = require('./routes/auth');
const bookingsRouter = require('./routes/bookings');
const flightsRouter = require('./routes/flights');

app.use('/api/tours', toursRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/flights', flightsRouter);

// Serve frontend static files (đưa xuống dưới)
app.use(express.static(path.join(__dirname, '../client/build')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Lỗi server, vui lòng thử lại sau'
    });
});

// Handle React routing, return all non-API requests to React app
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});