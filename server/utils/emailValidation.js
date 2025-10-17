/**
 * Email validation utility
 */

/**
 * Validate email format and basic checks
 * @param {string} email - Email address to validate
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
const validateEmail = async (email) => {
    try {
        // Basic email regex pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Check if email is provided
        if (!email) {
            return {
                isValid: false,
                error: 'Email là bắt buộc'
            };
        }

        // Check email format
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                error: 'Định dạng email không hợp lệ'
            };
        }

        // Check email length
        if (email.length > 254) {
            return {
                isValid: false,
                error: 'Email quá dài'
            };
        }

        // Check for common disposable email domains (optional)
        const disposableDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
        const domain = email.split('@')[1]?.toLowerCase();
        if (disposableDomains.includes(domain)) {
            return {
                isValid: false,
                error: 'Email tạm thời không được chấp nhận'
            };
        }

        return {
            isValid: true
        };
    } catch (error) {
        console.error('Email validation error:', error);
        return {
            isValid: false,
            error: 'Lỗi xác thực email'
        };
    }
};

module.exports = {
    validateEmail
};