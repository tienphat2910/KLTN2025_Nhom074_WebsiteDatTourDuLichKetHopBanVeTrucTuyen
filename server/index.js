const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { specs, swaggerUi } = require('./swagger');
require("dotenv").config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "LuTrip API Documentation"
}));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Kết nối MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ Kết nối MongoDB thành công"))
    .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "🚀 Server đang chạy!"
 */
app.get("/", (req, res) => {
    res.send("🚀 Server đang chạy!");
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: API status endpoint
 *     description: Get API status and information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API status information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 message:
 *                   type: string
 *                   example: "LuTrip API is running"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 */
app.get("/api/status", (req, res) => {
    res.json({
        status: "OK",
        message: "LuTrip API is running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🌐 Server chạy tại: http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});
