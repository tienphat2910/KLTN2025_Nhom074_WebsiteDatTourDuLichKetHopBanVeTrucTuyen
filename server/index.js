const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ Kết nối MongoDB thành công"))
    .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

// Routes đơn giản
app.get("/", (req, res) => {
    res.send("🚀 Server đang chạy!");
});

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🌐 Server chạy tại: http://localhost:${PORT}`);
});
