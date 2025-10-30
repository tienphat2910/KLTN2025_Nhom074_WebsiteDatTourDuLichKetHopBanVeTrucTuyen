/**
 * Validation utilities for user input
 */

// Email regex: standard email format
const EMAIL_REGEX = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})$/;

// Password regex: At least 6 characters, including uppercase, lowercase, number, and special character
const PASSWORD_REGEX = /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{6,}/;

// Full name regex: At least 2 words (first name and last name)
const FULLNAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,}(\s+[a-zA-ZÀ-ỹ\s]{1,})+$/;

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} Validation result
 */
const validateEmailFormat = (email) => {
    if (!email) {
        return {
            isValid: false,
            message: 'Email là bắt buộc'
        };
    }

    if (!EMAIL_REGEX.test(email)) {
        return {
            isValid: false,
            message: 'Email không đúng định dạng'
        };
    }

    return {
        isValid: true,
        message: 'Email hợp lệ'
    };
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength level
 */
const validatePassword = (password) => {
    if (!password) {
        return {
            isValid: false,
            message: 'Mật khẩu là bắt buộc',
            strength: 'weak'
        };
    }

    if (password.length < 6) {
        return {
            isValid: false,
            message: 'Mật khẩu phải có ít nhất 6 ký tự',
            strength: 'weak'
        };
    }

    // Check password strength
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.test(password);

    let strength = 'weak';
    let strengthScore = 0;

    if (hasLowerCase) strengthScore++;
    if (hasUpperCase) strengthScore++;
    if (hasNumber) strengthScore++;
    if (hasSpecialChar) strengthScore++;
    if (password.length >= 8) strengthScore++;

    if (strengthScore >= 5) {
        strength = 'strong';
    } else if (strengthScore >= 3) {
        strength = 'medium';
    }

    // Check if meets all requirements for strong password
    const meetsAllRequirements = PASSWORD_REGEX.test(password);

    if (!meetsAllRequirements) {
        return {
            isValid: false,
            message: 'Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
            strength: strength,
            requirements: {
                hasLowerCase,
                hasUpperCase,
                hasNumber,
                hasSpecialChar,
                hasMinLength: password.length >= 6
            }
        };
    }

    return {
        isValid: true,
        message: 'Mật khẩu hợp lệ',
        strength: strength,
        requirements: {
            hasLowerCase,
            hasUpperCase,
            hasNumber,
            hasSpecialChar,
            hasMinLength: password.length >= 6
        }
    };
};

/**
 * Validate full name format
 * @param {string} fullName - Full name to validate
 * @returns {object} Validation result
 */
const validateFullName = (fullName) => {
    if (!fullName) {
        return {
            isValid: false,
            message: 'Họ và tên là bắt buộc'
        };
    }

    // Trim and check for at least 2 words
    const trimmedName = fullName.trim();
    const words = trimmedName.split(/\s+/).filter(word => word.length > 0);

    if (words.length < 2) {
        return {
            isValid: false,
            message: 'Họ và tên phải có ít nhất 2 từ (VD: Nguyễn A)'
        };
    }

    // Check if all words contain only letters
    const invalidChars = /[^a-zA-ZÀ-ỹ\s]/.test(trimmedName);
    if (invalidChars) {
        return {
            isValid: false,
            message: 'Họ và tên chỉ được chứa chữ cái'
        };
    }

    return {
        isValid: true,
        message: 'Họ và tên hợp lệ'
    };
};

/**
 * Validate registration data
 * @param {object} data - Registration data {email, password, fullName}
 * @returns {object} Validation result
 */
const validateRegistration = (data) => {
    const { email, password, fullName } = data;
    const errors = [];

    // Validate email
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
        errors.push({ field: 'email', message: emailValidation.message });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        errors.push({ field: 'password', message: passwordValidation.message });
    }

    // Validate full name
    const fullNameValidation = validateFullName(fullName);
    if (!fullNameValidation.isValid) {
        errors.push({ field: 'fullName', message: fullNameValidation.message });
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        passwordStrength: passwordValidation.strength
    };
};

/**
 * Validate login data
 * @param {object} data - Login data {email, password}
 * @returns {object} Validation result
 */
const validateLogin = (data) => {
    const { email, password } = data;
    const errors = [];

    // Validate email
    const emailValidation = validateEmailFormat(email);
    if (!emailValidation.isValid) {
        errors.push({ field: 'email', message: emailValidation.message });
    }

    // Basic password check (don't validate strength on login)
    if (!password || password.length < 6) {
        errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

module.exports = {
    validateEmailFormat,
    validatePassword,
    validateFullName,
    validateRegistration,
    validateLogin,
    EMAIL_REGEX,
    PASSWORD_REGEX,
    FULLNAME_REGEX
};
