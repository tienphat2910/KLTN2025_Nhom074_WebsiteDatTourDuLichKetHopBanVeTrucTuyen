const jwt = require('jsonwebtoken');
const User = require('../models/User');

const admin = async (req, res, next) => {
    try {
        // If auth middleware already ran, req.user should exist
        if (req.user) {
            // Check if user has admin role
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Truy cập bị từ chối. Chỉ admin mới có quyền thực hiện thao tác này.'
                });
            }
            return next();
        }

        // Fallback: verify token if auth middleware didn't run
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không có token, truy cập bị từ chối'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Token không hợp lệ, người dùng không tồn tại'
                });
            }

            // Check if user has admin role
            if (user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Truy cập bị từ chối. Chỉ admin mới có quyền thực hiện thao tác này.'
                });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);

            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server trong quá trình xác thực admin'
        });
    }
};

module.exports = admin;