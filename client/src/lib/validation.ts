/**
 * Client-side validation utilities
 */

// Email regex
export const EMAIL_REGEX = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})$/;

// Password regex: At least 6 characters with uppercase, lowercase, number, and special character
export const PASSWORD_REGEX =
  /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{6,}/;

// Full name regex: At least 2 words
export const FULLNAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{2,}(\s+[a-zA-ZÀ-ỹ\s]{1,})+$/;

/**
 * Validate email format
 */
export const validateEmail = (
  email: string
): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: false, message: "Email là bắt buộc" };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: "Email không đúng định dạng" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate password
 */
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  message: string;
  strength: "weak" | "medium" | "strong";
} => {
  if (!password) {
    return {
      isValid: false,
      message: "Mật khẩu là bắt buộc",
      strength: "weak"
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      message: "Mật khẩu phải có ít nhất 6 ký tự",
      strength: "weak"
    };
  }

  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/.test(
    password
  );

  let strength: "weak" | "medium" | "strong" = "weak";
  let score = 0;

  if (hasLowerCase) score++;
  if (hasUpperCase) score++;
  if (hasNumber) score++;
  if (hasSpecialChar) score++;
  if (password.length >= 8) score++;

  if (score >= 5) {
    strength = "strong";
  } else if (score >= 3) {
    strength = "medium";
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message:
        "Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
      strength
    };
  }

  return { isValid: true, message: "", strength };
};

/**
 * Validate full name
 */
export const validateFullName = (
  fullName: string
): { isValid: boolean; message: string } => {
  if (!fullName) {
    return { isValid: false, message: "Họ và tên là bắt buộc" };
  }

  const trimmedName = fullName.trim();
  const words = trimmedName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length < 2) {
    return {
      isValid: false,
      message: "Họ và tên phải có ít nhất 2 từ (VD: Nguyễn A)"
    };
  }

  const invalidChars = /[^a-zA-ZÀ-ỹ\s]/.test(trimmedName);
  if (invalidChars) {
    return { isValid: false, message: "Họ và tên chỉ được chứa chữ cái" };
  }

  return { isValid: true, message: "" };
};

/**
 * Validate registration form
 */
export const validateRegistration = (data: {
  email: string;
  password: string;
  fullName: string;
  confirmPassword?: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  const fullNameValidation = validateFullName(data.fullName);
  if (!fullNameValidation.isValid) {
    errors.fullName = fullNameValidation.message;
  }

  if (
    data.confirmPassword !== undefined &&
    data.password !== data.confirmPassword
  ) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate login form
 */
export const validateLogin = (data: {
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  if (!data.password || data.password.length < 6) {
    errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
